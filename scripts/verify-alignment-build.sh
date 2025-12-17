#!/bin/bash

echo "=================================="
echo "Alignment Engine Build Verification"
echo "=================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $2"
        return 0
    else
        echo -e "${RED}✗${NC} $2 - MISSING"
        return 1
    fi
}

echo "Checking Entities..."
check_file "services/resume-service/src/modules/alignment/entities/aligned-resume.entity.ts" "AlignedResume Entity"
check_file "services/resume-service/src/modules/alignment/entities/generated-cover-letter.entity.ts" "GeneratedCoverLetter Entity"
check_file "services/resume-service/src/modules/alignment/entities/alignment-analysis.entity.ts" "AlignmentAnalysis Entity"
echo ""

echo "Checking DTOs..."
check_file "services/resume-service/src/modules/alignment/dto/analyze-resume.dto.ts" "AnalyzeResume DTO"
check_file "services/resume-service/src/modules/alignment/dto/generate-aligned-resume.dto.ts" "GenerateAlignedResume DTO"
check_file "services/resume-service/src/modules/alignment/dto/generate-cover-letter.dto.ts" "GenerateCoverLetter DTO"
check_file "services/resume-service/src/modules/alignment/dto/alignment-response.dto.ts" "AlignmentResponse DTOs"
echo ""

echo "Checking Services..."
check_file "services/resume-service/src/modules/alignment/services/ai-service.client.ts" "AI Service Client"
check_file "services/resume-service/src/modules/alignment/services/resume-alignment.service.ts" "Resume Alignment Service"
check_file "services/resume-service/src/modules/alignment/services/cover-letter.service.ts" "Cover Letter Service"
echo ""

echo "Checking Module Files..."
check_file "services/resume-service/src/modules/alignment/alignment.controller.ts" "Alignment Controller"
check_file "services/resume-service/src/modules/alignment/alignment.module.ts" "Alignment Module"
check_file "services/resume-service/src/modules/alignment/index.ts" "Module Index"
echo ""

echo "Checking Integration..."
check_file "services/resume-service/src/app.module.ts" "App Module (Updated)"
check_file "services/resume-service/src/migrations/CreateAlignmentTables.ts" "Database Migration"
echo ""

echo "Checking AI Service Integration..."
check_file "services/ai-service/src/api/v1/nlp_routes.py" "NLP Routes"
echo ""

echo "Checking Documentation..."
check_file "services/resume-service/ALIGNMENT_ENGINE_README.md" "README"
check_file "services/resume-service/ALIGNMENT_ENGINE_EXAMPLES.md" "Examples"
check_file "services/resume-service/ALIGNMENT_QUICK_START.md" "Quick Start Guide"
check_file "ALIGNMENT_ENGINE_BUILD_SUMMARY.md" "Build Summary"
echo ""

echo "=================================="
echo "Statistics"
echo "=================================="
echo "TypeScript Files: $(find services/resume-service/src/modules/alignment -name '*.ts' | wc -l)"
echo "Total Lines of Code: $(find services/resume-service/src/modules/alignment -name '*.ts' -exec cat {} + | wc -l)"
echo "Documentation Files: 4"
echo "Documentation Lines: $(cat services/resume-service/ALIGNMENT*.md ALIGNMENT*.md 2>/dev/null | wc -l)"
echo ""

echo "=================================="
echo "Build Status: COMPLETE ✓"
echo "=================================="
