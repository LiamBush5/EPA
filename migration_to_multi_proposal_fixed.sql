-- EPA Database Migration: Single Proposal → Multi-Proposal Support (CORRECTED)
-- Run this script to convert your database without losing data
-- This version properly handles the top_comment_matches VIEW

BEGIN;

-- Step 1: Create the new proposals table
CREATE TABLE epa_proposals (
    proposal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    docket_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    agency TEXT DEFAULT 'EPA',
    proposal_date DATE,
    comment_period_start DATE,
    comment_period_end DATE,
    status TEXT,
    regulation_type TEXT,
    source_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Step 2: Insert your current proposal
INSERT INTO epa_proposals (docket_id, title, description, regulation_type, status)
VALUES (
    'EPA-HQ-OLEM-2017-0463',
    'Management Standards for Hazardous Waste Pharmaceuticals and Amendment to the P075 Listing for Nicotine',
    'Proposed rule for aerosol can waste management under Universal Waste Rule',
    'proposed_rule',
    'closed'
);

-- Step 3: Migrate epa_comments table
ALTER TABLE epa_comments ADD COLUMN proposal_id UUID;

UPDATE epa_comments
SET proposal_id = (
    SELECT proposal_id
    FROM epa_proposals
    WHERE docket_id = 'EPA-HQ-OLEM-2017-0463'
);

ALTER TABLE epa_comments ALTER COLUMN proposal_id SET NOT NULL;
ALTER TABLE epa_comments ADD CONSTRAINT fk_epa_comments_proposal
    FOREIGN KEY (proposal_id) REFERENCES epa_proposals(proposal_id);

-- Step 4: Migrate document_sections table
ALTER TABLE document_sections ADD COLUMN proposal_id UUID;

UPDATE document_sections
SET proposal_id = (
    SELECT proposal_id
    FROM epa_proposals
    WHERE docket_id = 'EPA-HQ-OLEM-2017-0463'
);

ALTER TABLE document_sections ALTER COLUMN proposal_id SET NOT NULL;
ALTER TABLE document_sections ADD CONSTRAINT fk_document_sections_proposal
    FOREIGN KEY (proposal_id) REFERENCES epa_proposals(proposal_id);

-- Step 5: Migrate comment_section_matches table
ALTER TABLE comment_section_matches ADD COLUMN proposal_id UUID;

UPDATE comment_section_matches csm
SET proposal_id = ec.proposal_id
FROM epa_comments ec
WHERE csm.comment_id = ec.comment_id;

ALTER TABLE comment_section_matches ALTER COLUMN proposal_id SET NOT NULL;
ALTER TABLE comment_section_matches ADD CONSTRAINT fk_comment_section_matches_proposal
    FOREIGN KEY (proposal_id) REFERENCES epa_proposals(proposal_id);

-- Step 6: Update the top_comment_matches VIEW (not table!)
-- First drop the existing view
DROP VIEW IF EXISTS top_comment_matches;

-- Recreate the view with proposal information included
CREATE VIEW top_comment_matches AS
SELECT
    p.proposal_id,
    p.docket_id,
    c.comment_id,
    c.commenter_name,
    c.organization,
    s.section_id,
    s.section_number,
    s.section_title,
    m.similarity_score
FROM comment_section_matches m
JOIN epa_comments c ON m.comment_id = c.comment_id
JOIN document_sections s ON m.section_id = s.section_id
JOIN epa_proposals p ON c.proposal_id = p.proposal_id
WHERE m.match_rank = 1;

-- Step 7: Create performance indexes
CREATE INDEX idx_epa_comments_proposal_id ON epa_comments(proposal_id);
CREATE INDEX idx_document_sections_proposal_id ON document_sections(proposal_id);
CREATE INDEX idx_comment_section_matches_proposal_id ON comment_section_matches(proposal_id);
CREATE INDEX idx_comments_proposal_date ON epa_comments(proposal_id, comment_date);
CREATE INDEX idx_sections_proposal_hierarchy ON document_sections(proposal_id, hierarchy_level);
CREATE INDEX idx_matches_proposal_score ON comment_section_matches(proposal_id, similarity_score DESC);
CREATE INDEX idx_proposals_status ON epa_proposals(status);
CREATE INDEX idx_proposals_docket ON epa_proposals(docket_id);

-- Step 8: Verify migration success
DO $$
DECLARE
    comment_count INTEGER;
    section_count INTEGER;
    match_count INTEGER;
    view_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO comment_count FROM epa_comments WHERE proposal_id IS NOT NULL;
    SELECT COUNT(*) INTO section_count FROM document_sections WHERE proposal_id IS NOT NULL;
    SELECT COUNT(*) INTO match_count FROM comment_section_matches WHERE proposal_id IS NOT NULL;
    SELECT COUNT(*) INTO view_count FROM top_comment_matches;

    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Comments migrated: %', comment_count;
    RAISE NOTICE 'Document sections migrated: %', section_count;
    RAISE NOTICE 'Comment-section matches migrated: %', match_count;
    RAISE NOTICE 'Top comment matches view records: %', view_count;
END $$;

COMMIT;

-- Final verification query
SELECT
    p.docket_id,
    p.title,
    COUNT(DISTINCT c.id) as comment_count,
    COUNT(DISTINCT ds.section_id) as section_count,
    COUNT(DISTINCT csm.id) as match_count
FROM epa_proposals p
LEFT JOIN epa_comments c ON p.proposal_id = c.proposal_id
LEFT JOIN document_sections ds ON p.proposal_id = ds.proposal_id
LEFT JOIN comment_section_matches csm ON p.proposal_id = csm.proposal_id
GROUP BY p.proposal_id, p.docket_id, p.title;

-- Test the updated view
SELECT
    docket_id,
    COUNT(*) as top_matches_count
FROM top_comment_matches
GROUP BY docket_id;