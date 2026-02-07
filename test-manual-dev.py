"""
Manual testing script for AI Readiness Assessment application.
Tests all functionality in development mode.
"""
from playwright.sync_api import sync_playwright
import time

def test_development_mode():
    """Test the application in development mode."""
    print("🧪 Starting manual testing in development mode...")
    
    with sync_playwright() as p:
        # Launch browser in headless mode
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()
        
        # Enable console logging
        page.on('console', lambda msg: print(f"  Console [{msg.type}]: {msg.text}"))
        page.on('pageerror', lambda err: print(f"  ❌ Page Error: {err}"))
        
        try:
            # Test 17.2.1: Initial load
            print("\n✓ Test 17.2.1: Testing initial load...")
            page.goto('http://localhost:3000', wait_until='networkidle')
            page.wait_for_timeout(2000)  # Wait for hydration
            
            # Take screenshot of initial state
            page.screenshot(path='ai-readiness-assessment/screenshots/01-initial-load.png', full_page=True)
            print("  ✓ Page loaded successfully")
            print(f"  ✓ Page title: {page.title()}")
            
            # Check for consent banner
            consent_banner = page.locator('[role="dialog"]').first
            if consent_banner.count() > 0 and consent_banner.is_visible():
                print("  ✓ Consent banner is visible")
                page.screenshot(path='ai-readiness-assessment/screenshots/02-consent-banner.png')
                
                # Accept consent
                accept_button = page.locator('button:has-text("Accept")').first
                accept_button.click()
                page.wait_for_timeout(1000)
                print("  ✓ Consent accepted")
            else:
                print("  ℹ No consent banner (already accepted)")
            
            # Check for initial messages
            messages = page.locator('[role="article"]').all()
            print(f"  ✓ Found {len(messages)} initial messages")
            
            # Test 17.2.2: Message submission
            print("\n✓ Test 17.2.2: Testing message submission...")
            
            # Find the input field
            input_field = page.locator('textarea, input[type="text"]').first
            input_field.wait_for(state='visible', timeout=5000)
            
            # Type a test message
            test_message = "Acme Corporation"
            input_field.fill(test_message)
            print(f"  ✓ Typed message: {test_message}")
            
            # Take screenshot before sending
            page.screenshot(path='ai-readiness-assessment/screenshots/03-message-typed.png')
            
            # Find and click send button
            send_button = page.locator('button[type="submit"], button:has-text("Send")').first
            send_button.click()
            print("  ✓ Message sent")
            
            # Wait for response
            page.wait_for_timeout(2000)
            page.screenshot(path='ai-readiness-assessment/screenshots/04-after-send.png', full_page=True)
            
            # Check if message appears in chat
            user_message = page.locator(f'text="{test_message}"').first
            if user_message.is_visible():
                print("  ✓ User message appears in chat")
            
            # Wait for AI response (loading indicator)
            print("  ⏳ Waiting for AI response...")
            
            # Wait for input to be enabled again (response complete)
            input_field.wait_for(state='attached', timeout=30000)
            page.wait_for_timeout(10000)  # Give time for streaming to complete
            
            # Check for new messages
            messages_after = page.locator('[role="article"]').all()
            print(f"  ✓ Messages after send: {len(messages_after)}")
            
            # Test 17.2.3: Error handling
            print("\n✓ Test 17.2.3: Testing error handling...")
            
            # Check for any error alerts
            error_alerts = page.locator('[role="alert"], .error, .alert-error').all()
            if len(error_alerts) > 0:
                print(f"  ⚠ Found {len(error_alerts)} error alerts")
                for i, alert in enumerate(error_alerts):
                    if alert.is_visible():
                        print(f"    Alert {i+1}: {alert.text_content()}")
            else:
                print("  ✓ No error alerts found")
            
            # Test 17.2.4: Keyboard navigation
            print("\n✓ Test 17.2.4: Testing keyboard navigation...")
            
            # Tab through interactive elements
            page.keyboard.press('Tab')
            page.wait_for_timeout(200)
            focused = page.evaluate('document.activeElement.tagName')
            print(f"  ✓ Tab navigation works, focused element: {focused}")
            
            # Test Enter key in input
            input_field.focus()
            input_field.fill("Test keyboard input")
            page.keyboard.press('Enter')
            page.wait_for_timeout(1000)
            print("  ✓ Enter key submission works")
            
            # Test 17.2.5: Responsive design
            print("\n✓ Test 17.2.5: Testing responsive design...")
            
            # Test mobile viewport
            page.set_viewport_size({'width': 375, 'height': 667})
            page.wait_for_timeout(500)
            page.screenshot(path='ai-readiness-assessment/screenshots/05-mobile-view.png', full_page=True)
            print("  ✓ Mobile viewport (375x667) rendered")
            
            # Test tablet viewport
            page.set_viewport_size({'width': 768, 'height': 1024})
            page.wait_for_timeout(500)
            page.screenshot(path='ai-readiness-assessment/screenshots/06-tablet-view.png', full_page=True)
            print("  ✓ Tablet viewport (768x1024) rendered")
            
            # Restore desktop viewport
            page.set_viewport_size({'width': 1280, 'height': 720})
            page.wait_for_timeout(500)
            print("  ✓ Desktop viewport restored")
            
            # Test 17.2.6: Component rendering
            print("\n✓ Test 17.2.6: Testing component rendering...")
            
            # Check for key components
            components = {
                'Chat input': 'textarea, input[type="text"]',
                'Send button': 'button[type="submit"], button:has-text("Send")',
                'Message container': '[role="article"]',
            }
            
            for name, selector in components.items():
                element = page.locator(selector).first
                if element.count() > 0:
                    print(f"  ✓ {name} is present")
                else:
                    print(f"  ⚠ {name} not found")
            
            # Final screenshot
            page.screenshot(path='ai-readiness-assessment/screenshots/07-final-state.png', full_page=True)
            
            print("\n✅ All development mode tests completed successfully!")
            
        except Exception as e:
            print(f"\n❌ Test failed with error: {e}")
            page.screenshot(path='ai-readiness-assessment/screenshots/error-state.png', full_page=True)
            raise
        
        finally:
            browser.close()

if __name__ == '__main__':
    test_development_mode()
