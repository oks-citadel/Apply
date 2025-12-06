#!/bin/bash

# Setup script for AI Agents
# Run this from the ai-service directory: bash setup_agents.sh

echo "================================================"
echo "AI Agents Setup Script"
echo "================================================"
echo ""

# Create agents directory
echo "Creating agents directory..."
mkdir -p src/agents

# Create __init__.py
echo "Creating src/agents/__init__.py..."
cat > src/agents/__init__.py << 'EOF'
"""
AI Agent modules for advanced job search assistance.
"""

from .competitive_analysis import CompetitiveAnalysisAgent
from .fraud_detection import FraudDetectionAgent
from .emotional_intelligence import EmotionalIntelligenceAgent
from .multi_language import MultiLanguageAgent

__all__ = [
    "CompetitiveAnalysisAgent",
    "FraudDetectionAgent",
    "EmotionalIntelligenceAgent",
    "MultiLanguageAgent",
]
EOF

echo "✓ Created __init__.py"

# Copy agent files
echo ""
echo "================================================"
echo "MANUAL STEPS REQUIRED:"
echo "================================================"
echo ""
echo "1. Copy COMPETITIVE_ANALYSIS_AGENT.py content to:"
echo "   src/agents/competitive_analysis.py"
echo ""
echo "2. Copy FRAUD_DETECTION_AGENT.py content to:"
echo "   src/agents/fraud_detection.py"
echo ""
echo "3. Copy EMOTIONAL_INTELLIGENCE_AGENT.py content to:"
echo "   src/agents/emotional_intelligence.py"
echo ""
echo "4. Copy MULTI_LANGUAGE_AGENT.py content to:"
echo "   src/agents/multi_language.py"
echo ""
echo "5. Copy AGENTS_API_ROUTES.py content to:"
echo "   src/api/routes/agents.py"
echo ""
echo "6. Update src/main.py with the following changes:"
echo ""
echo "   a) Add to imports:"
echo "      from .agents import ("
echo "          CompetitiveAnalysisAgent,"
echo "          FraudDetectionAgent,"
echo "          EmotionalIntelligenceAgent,"
echo "          MultiLanguageAgent"
echo "      )"
echo "      from .api.routes import agents as agents_routes"
echo ""
echo "   b) Add to ServiceState class:"
echo "      competitive_analysis_agent: CompetitiveAnalysisAgent"
echo "      fraud_detection_agent: FraudDetectionAgent"
echo "      emotional_intelligence_agent: EmotionalIntelligenceAgent"
echo "      multi_language_agent: MultiLanguageAgent"
echo ""
echo "   c) Add to lifespan startup (after other services):"
echo "      # Initialize AI Agents"
echo "      state.competitive_analysis_agent = CompetitiveAnalysisAgent("
echo "          llm_service=state.llm_service"
echo "      )"
echo "      logger.info(\"Competitive Analysis Agent initialized\")"
echo ""
echo "      state.fraud_detection_agent = FraudDetectionAgent("
echo "          llm_service=state.llm_service"
echo "      )"
echo "      logger.info(\"Fraud Detection Agent initialized\")"
echo ""
echo "      state.emotional_intelligence_agent = EmotionalIntelligenceAgent("
echo "          llm_service=state.llm_service"
echo "      )"
echo "      logger.info(\"Emotional Intelligence Agent initialized\")"
echo ""
echo "      state.multi_language_agent = MultiLanguageAgent("
echo "          llm_service=state.llm_service"
echo "      )"
echo "      logger.info(\"Multi-Language Agent initialized\")"
echo ""
echo "      # Store in app state"
echo "      app.state.competitive_analysis_agent = state.competitive_analysis_agent"
echo "      app.state.fraud_detection_agent = state.fraud_detection_agent"
echo "      app.state.emotional_intelligence_agent = state.emotional_intelligence_agent"
echo "      app.state.multi_language_agent = state.multi_language_agent"
echo ""
echo "   d) Add router (after existing routers):"
echo "      app.include_router("
echo "          agents_routes.router,"
echo "          prefix=\"/api/ai/agents\","
echo "          tags=[\"AI Agents\"],"
echo "      )"
echo ""
echo "================================================"
echo "After completing these steps, restart the ai-service:"
echo "  python -m src.main"
echo "================================================"
