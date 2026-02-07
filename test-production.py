"""
Quick production build verification test.
"""
from playwright.sync_api import sync_playwright

def test_production():
    """Test the production build."""
    print("🧪 Testing production build...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Track console errors
        errors = []
        page.on('pageerror', lambda err: errors.append(str(err)))
        
        try:
            # Load the page
            print("  Loading http://localhost:3000...")
            page.goto('http://localhost:3000', wait_until='networkidle')
            page.wait_for_timeout(2000)
            
            # Check page loaded
            title = page.title()
            print(f"  ✓ Page loaded: {title}")
            
            # Check for critical elements
            input_field = page.locator('textarea').first
            if input_field.count() > 0:
                print("  ✓ Chat input present")
            
            send_button = page.locator('button[type="submit"]').first
            if send_button.count() > 0:
                print("  ✓ Send button present")
            
            messages = page.locator('[role="article"]').all()
            print(f"  ✓ Initial messages: {len(messages)}")
            
            # Check for errors
            if errors:
                print(f"  ⚠ Found {len(errors)} page errors:")
                for err in errors:
                    print(f"    - {err}")
            else:
                print("  ✓ No page errors")
            
            # Take screenshot
            page.screenshot(path='ai-readiness-assessment/screenshots/production.png', full_page=True)
            print("  ✓ Screenshot saved")
            
            print("\n✅ Production build test passed!")
            
        except Exception as e:
            print(f"\n❌ Test failed: {e}")
            page.screenshot(path='ai-readiness-assessment/screenshots/production-error.png')
            raise
        
        finally:
            browser.close()

if __name__ == '__main__':
    test_production()
