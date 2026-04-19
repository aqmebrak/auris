
// run headroom proxy
headroom: 
	@echo "Running headroom proxy..."
	source ./auris-venv/bin/activate && \ headroom proxy

claude:
	@echo "Running claude proxy..."
	ANTHROPIC_BASE_URL=http://localhost:8787 claude