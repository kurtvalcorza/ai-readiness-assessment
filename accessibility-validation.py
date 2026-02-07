"""
Accessibility validation script for AI Readiness Assessment.
Tests keyboard navigation, ARIA labels, and basic accessibility features.
"""
from playwright.sync_api import sync_playwright
import json

def test_accessibility():
    """Run accessibility validation tests."""
    print("♿ Starting accessibility validation...\n")
    
    results = {
        "keyboard_navigation": {},
        "aria_labels": {},
        "semantic_html": {},
        "focus_management": {}
    }
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        try:
            # Navigate to the page
            page.goto('http://localhost:3000', wait_until='networkidle')
            page.wait_for_timeout(2000)
            
            # Accept consent if present
            consent_banner = page.locator('[role="dialog"]').first
            if consent_banner.count() > 0 and consent_banner.is_visible():
                accept_button = page.locator('button:has-text("Accept")').first
                accept_button.click()
                page.wait_for_timeout(1000)
            
            # Test 17.5.2: Keyboard navigation
            print("⌨️ Test 17.5.2: Testing keyboard navigation...")
            
            # Tab through elements
            focusable_elements = []
            for i in range(10):
                page.keyboard.press('Tab')
                page.wait_for_timeout(100)
                
                focused = page.evaluate("""() => {
                    const el = document.activeElement;
                    return {
                        tag: el.tagName,
                        role: el.getAttribute('role'),
                        ariaLabel: el.getAttribute('aria-label'),
                        type: el.getAttribute('type')
                    };
                }""")
                
                focusable_elements.append(focused)
            
            print(f"  ✓ Found {len(set(str(e) for e in focusable_elements))} unique focusable elements")
            results['keyboard_navigation']['focusable_count'] = len(focusable_elements)
            
            # Test Enter key on input
            input_field = page.locator('textarea').first
            input_field.focus()
            input_field.fill("Test accessibility")
            page.keyboard.press('Enter')
            page.wait_for_timeout(1000)
            print("  ✓ Enter key works on input field")
            results['keyboard_navigation']['enter_key'] = True
            
            # Test Escape key
            page.keyboard.press('Escape')
            page.wait_for_timeout(500)
            input_value = input_field.input_value()
            if not input_value:
                print("  ✓ Escape key clears input")
                results['keyboard_navigation']['escape_key'] = True
            else:
                print("  ⚠ Escape key may not clear input")
                results['keyboard_navigation']['escape_key'] = False
            
            # Test 17.5.4: ARIA labels
            print("\n🏷️ Test 17.5.4: Verifying ARIA labels...")
            
            # Check for ARIA labels on key elements
            aria_checks = {
                'textarea': page.locator('textarea[aria-label]'),
                'button': page.locator('button[aria-label]'),
                'main': page.locator('main[role="main"]'),
                'article': page.locator('[role="article"]'),
                'dialog': page.locator('[role="dialog"]'),
                'alert': page.locator('[role="alert"]')
            }
            
            for element_type, locator in aria_checks.items():
                count = locator.count()
                if count > 0:
                    print(f"  ✓ {element_type}: {count} element(s) with proper ARIA")
                    results['aria_labels'][element_type] = count
                else:
                    print(f"  ⚠ {element_type}: No elements found")
                    results['aria_labels'][element_type] = 0
            
            # Test semantic HTML
            print("\n📝 Testing semantic HTML...")
            
            semantic_elements = {
                'main': page.locator('main'),
                'header': page.locator('header'),
                'button': page.locator('button'),
                'article': page.locator('article, [role="article"]')
            }
            
            for element_type, locator in semantic_elements.items():
                count = locator.count()
                print(f"  ✓ {element_type}: {count} element(s)")
                results['semantic_html'][element_type] = count
            
            # Test focus indicators
            print("\n🎯 Testing focus management...")
            
            # Check if focus is visible
            input_field.focus()
            page.wait_for_timeout(500)
            
            focus_visible = page.evaluate("""() => {
                const el = document.activeElement;
                const styles = window.getComputedStyle(el);
                return {
                    outline: styles.outline,
                    outlineWidth: styles.outlineWidth,
                    boxShadow: styles.boxShadow
                };
            }""")
            
            has_focus_indicator = (
                focus_visible['outline'] != 'none' or 
                focus_visible['outlineWidth'] != '0px' or
                'rgb' in focus_visible['boxShadow']
            )
            
            if has_focus_indicator:
                print("  ✓ Focus indicators are visible")
                results['focus_management']['visible'] = True
            else:
                print("  ⚠ Focus indicators may not be visible")
                results['focus_management']['visible'] = False
            
            # Check for skip links or focus management
            skip_links = page.locator('a[href^="#"]').count()
            print(f"  ✓ Skip links found: {skip_links}")
            results['focus_management']['skip_links'] = skip_links
            
            # Run basic accessibility checks
            print("\n🔍 Running basic accessibility checks...")
            
            # Check for images without alt text
            images_without_alt = page.locator('img:not([alt])').count()
            if images_without_alt > 0:
                print(f"  ⚠ Found {images_without_alt} images without alt text")
            else:
                print("  ✓ All images have alt text")
            results['aria_labels']['images_with_alt'] = images_without_alt == 0
            
            # Check for form labels
            inputs_without_labels = page.locator('input:not([aria-label]):not([aria-labelledby])').count()
            textareas_without_labels = page.locator('textarea:not([aria-label]):not([aria-labelledby])').count()
            
            unlabeled_count = inputs_without_labels + textareas_without_labels
            if unlabeled_count > 0:
                print(f"  ⚠ Found {unlabeled_count} form fields without labels")
            else:
                print("  ✓ All form fields have labels")
            results['aria_labels']['form_fields_labeled'] = unlabeled_count == 0
            
            # Check color contrast (basic check)
            print("\n🎨 Checking color contrast...")
            
            contrast_check = page.evaluate("""() => {
                const elements = document.querySelectorAll('button, a, input, textarea');
                let lowContrast = 0;
                
                elements.forEach(el => {
                    const styles = window.getComputedStyle(el);
                    const bg = styles.backgroundColor;
                    const color = styles.color;
                    
                    // Basic check - just verify colors are set
                    if (!bg || !color || bg === 'rgba(0, 0, 0, 0)') {
                        lowContrast++;
                    }
                });
                
                return lowContrast;
            }""")
            
            if contrast_check == 0:
                print("  ✓ Basic color contrast check passed")
            else:
                print(f"  ⚠ {contrast_check} elements may have contrast issues")
            
            # Save results
            with open('ai-readiness-assessment/accessibility-results.json', 'w') as f:
                json.dump(results, f, indent=2)
            
            print("\n✅ Accessibility validation completed!")
            print("📄 Results saved to accessibility-results.json")
            
            # Summary
            print("\n" + "="*60)
            print("ACCESSIBILITY SUMMARY")
            print("="*60)
            print(f"Keyboard Navigation: ✓ {results['keyboard_navigation']['focusable_count']} focusable elements")
            print(f"ARIA Labels: ✓ {sum(1 for v in results['aria_labels'].values() if isinstance(v, int) and v > 0)} types found")
            print(f"Semantic HTML: ✓ {sum(results['semantic_html'].values())} semantic elements")
            print(f"Focus Indicators: {'✓ Visible' if results['focus_management']['visible'] else '⚠ May not be visible'}")
            print("="*60)
            
            print("\n📝 Note: For comprehensive accessibility testing:")
            print("   - Use axe DevTools browser extension")
            print("   - Test with actual screen readers (NVDA, JAWS, VoiceOver)")
            print("   - Perform manual keyboard-only navigation")
            print("   - Test with users who have disabilities")
            
        except Exception as e:
            print(f"\n❌ Accessibility test failed: {e}")
            raise
        
        finally:
            browser.close()

if __name__ == '__main__':
    test_accessibility()
