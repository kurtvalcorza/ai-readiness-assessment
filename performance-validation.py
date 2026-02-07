"""
Performance validation script for AI Readiness Assessment.
Tests bundle size, page load time, and interaction responsiveness.
"""
from playwright.sync_api import sync_playwright
import time
import json

def test_performance():
    """Run performance validation tests."""
    print("🚀 Starting performance validation...\n")
    
    results = {
        "bundle_size": {},
        "page_load": {},
        "interaction": {},
        "lighthouse": {}
    }
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()
        
        # Track network requests
        resources = []
        page.on('response', lambda response: resources.append({
            'url': response.url,
            'status': response.status,
            'size': len(response.body()) if response.status == 200 else 0,
            'type': response.headers.get('content-type', 'unknown')
        }))
        
        try:
            # Test 17.3.2: Page load time
            print("📊 Test 17.3.2: Measuring page load time...")
            start_time = time.time()
            page.goto('http://localhost:3000', wait_until='networkidle')
            load_time = time.time() - start_time
            
            results['page_load']['total_time'] = round(load_time, 2)
            print(f"  ✓ Page load time: {load_time:.2f}s")
            
            if load_time < 3.0:
                print("  ✓ PASS: Load time is excellent (< 3s)")
            elif load_time < 5.0:
                print("  ⚠ WARNING: Load time is acceptable (< 5s)")
            else:
                print("  ❌ FAIL: Load time is too slow (> 5s)")
            
            # Analyze resources
            print("\n📦 Analyzing loaded resources...")
            js_resources = [r for r in resources if 'javascript' in r.get('type', '')]
            css_resources = [r for r in resources if 'css' in r.get('type', '')]
            
            total_js_size = sum(r['size'] for r in js_resources) / 1024  # KB
            total_css_size = sum(r['size'] for r in css_resources) / 1024  # KB
            
            results['bundle_size']['js_size_kb'] = round(total_js_size, 2)
            results['bundle_size']['css_size_kb'] = round(total_css_size, 2)
            results['bundle_size']['js_files'] = len(js_resources)
            results['bundle_size']['css_files'] = len(css_resources)
            
            print(f"  JavaScript: {total_js_size:.2f} KB ({len(js_resources)} files)")
            print(f"  CSS: {total_css_size:.2f} KB ({len(css_resources)} files)")
            print(f"  Total: {(total_js_size + total_css_size):.2f} KB")
            
            # Test 17.3.3: Interaction responsiveness
            print("\n⚡ Test 17.3.3: Measuring interaction responsiveness...")
            
            # Measure input field focus time
            input_field = page.locator('textarea').first
            start = time.time()
            input_field.focus()
            focus_time = (time.time() - start) * 1000  # ms
            
            results['interaction']['focus_time_ms'] = round(focus_time, 2)
            print(f"  ✓ Input focus time: {focus_time:.2f}ms")
            
            # Measure typing responsiveness
            start = time.time()
            input_field.type("Test message", delay=0)
            type_time = (time.time() - start) * 1000  # ms
            
            results['interaction']['type_time_ms'] = round(type_time, 2)
            print(f"  ✓ Typing time (12 chars): {type_time:.2f}ms")
            
            # Measure button click responsiveness
            send_button = page.locator('button[type="submit"]').first
            start = time.time()
            send_button.click()
            click_time = (time.time() - start) * 1000  # ms
            
            results['interaction']['click_time_ms'] = round(click_time, 2)
            print(f"  ✓ Button click time: {click_time:.2f}ms")
            
            # Overall responsiveness assessment
            avg_interaction = (focus_time + type_time + click_time) / 3
            results['interaction']['avg_time_ms'] = round(avg_interaction, 2)
            
            if avg_interaction < 100:
                print(f"  ✓ PASS: Excellent responsiveness (avg: {avg_interaction:.2f}ms)")
            elif avg_interaction < 200:
                print(f"  ⚠ WARNING: Good responsiveness (avg: {avg_interaction:.2f}ms)")
            else:
                print(f"  ❌ FAIL: Poor responsiveness (avg: {avg_interaction:.2f}ms)")
            
            # Performance metrics from browser
            print("\n📈 Browser performance metrics...")
            metrics = page.evaluate("""() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                return {
                    domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                    domInteractive: perfData.domInteractive - perfData.fetchStart,
                    loadComplete: perfData.loadEventEnd - perfData.fetchStart
                };
            }""")
            
            results['page_load']['dom_content_loaded_ms'] = round(metrics['domContentLoaded'], 2)
            results['page_load']['dom_interactive_ms'] = round(metrics['domInteractive'], 2)
            results['page_load']['load_complete_ms'] = round(metrics['loadComplete'], 2)
            
            print(f"  DOM Content Loaded: {metrics['domContentLoaded']:.2f}ms")
            print(f"  DOM Interactive: {metrics['domInteractive']:.2f}ms")
            print(f"  Load Complete: {metrics['loadComplete']:.2f}ms")
            
            # Save results
            with open('ai-readiness-assessment/performance-results.json', 'w') as f:
                json.dump(results, f, indent=2)
            
            print("\n✅ Performance validation completed!")
            print("📄 Results saved to performance-results.json")
            
            # Summary
            print("\n" + "="*60)
            print("PERFORMANCE SUMMARY")
            print("="*60)
            print(f"Bundle Size: {(total_js_size + total_css_size):.2f} KB")
            print(f"Page Load: {load_time:.2f}s")
            print(f"Avg Interaction: {avg_interaction:.2f}ms")
            print("="*60)
            
        except Exception as e:
            print(f"\n❌ Performance test failed: {e}")
            raise
        
        finally:
            browser.close()

if __name__ == '__main__':
    test_performance()
