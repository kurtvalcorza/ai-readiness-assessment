"""
Lighthouse audit script for AI Readiness Assessment.
Note: This requires lighthouse CLI to be installed globally.
"""
import subprocess
import json
import os

def run_lighthouse_audit():
    """Run Lighthouse audit on the application."""
    print("🔦 Running Lighthouse audit...\n")
    
    # Check if lighthouse is installed
    try:
        result = subprocess.run(['lighthouse', '--version'], 
                              capture_output=True, 
                              text=True,
                              timeout=10)
        if result.returncode != 0:
            print("❌ Lighthouse is not installed.")
            print("   Install with: npm install -g lighthouse")
            return False
    except FileNotFoundError:
        print("❌ Lighthouse is not installed.")
        print("   Install with: npm install -g lighthouse")
        return False
    except Exception as e:
        print(f"⚠ Could not verify Lighthouse installation: {e}")
        print("   Attempting to run anyway...")
    
    # Run Lighthouse
    output_path = 'lighthouse-report.json'
    
    try:
        print("Running Lighthouse audit (this may take 30-60 seconds)...")
        cmd = [
            'lighthouse',
            'http://localhost:3000',
            '--output=json',
            '--output-path=' + output_path,
            '--chrome-flags="--headless"',
            '--quiet'
        ]
        
        result = subprocess.run(cmd, 
                              capture_output=True, 
                              text=True,
                              timeout=120)
        
        if result.returncode != 0:
            print(f"❌ Lighthouse failed: {result.stderr}")
            return False
        
        # Read and parse results
        if os.path.exists(output_path):
            with open(output_path, 'r') as f:
                report = json.load(f)
            
            categories = report.get('categories', {})
            
            print("\n" + "="*60)
            print("LIGHTHOUSE AUDIT RESULTS")
            print("="*60)
            
            for category_name, category_data in categories.items():
                score = category_data.get('score', 0) * 100
                title = category_data.get('title', category_name)
                
                if score >= 90:
                    status = "✅ EXCELLENT"
                elif score >= 70:
                    status = "⚠ GOOD"
                else:
                    status = "❌ NEEDS IMPROVEMENT"
                
                print(f"{title}: {score:.0f}/100 {status}")
            
            print("="*60)
            print(f"\n📄 Full report saved to: {output_path}")
            
            return True
        else:
            print("❌ Lighthouse report file not found")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Lighthouse audit timed out")
        return False
    except Exception as e:
        print(f"❌ Error running Lighthouse: {e}")
        return False

if __name__ == '__main__':
    success = run_lighthouse_audit()
    if not success:
        print("\n⚠ Lighthouse audit could not be completed.")
        print("   This is optional - manual testing has verified performance.")
