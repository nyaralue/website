#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class ProductCatalogTester:
    def __init__(self, base_url="http://localhost:3000"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.product_ids = []

    def run_test(self, name, method, endpoint, expected_status, data=None, validate_func=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json()
                    if validate_func:
                        validation_result = validate_func(response_data)
                        if validation_result is True:
                            self.tests_passed += 1
                            print(f"✅ Passed - Status: {response.status_code}")
                            return True, response_data
                        else:
                            print(f"❌ Failed - Validation error: {validation_result}")
                            self.failed_tests.append(f"{name}: {validation_result}")
                            return False, response_data
                    else:
                        self.tests_passed += 1
                        print(f"✅ Passed - Status: {response.status_code}")
                        return True, response_data
                except json.JSONDecodeError:
                    print(f"❌ Failed - Invalid JSON response")
                    self.failed_tests.append(f"{name}: Invalid JSON response")
                    return False, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append(f"{name}: {str(e)}")
            return False, {}

    def validate_products_structure(self, data):
        """Validate the products API response structure"""
        if not isinstance(data, dict):
            return "Response is not a dictionary"
        
        if 'categories' not in data:
            return "Missing 'categories' key in response"
        
        categories = data['categories']
        if not isinstance(categories, dict):
            return "Categories is not a dictionary"
        
        expected_categories = ['table-lamp', 'garden-lights', 'wall-lights', 'chandelier']
        found_categories = list(categories.keys())
        
        print(f"   Found categories: {found_categories}")
        
        total_products = 0
        for category, products in categories.items():
            if not isinstance(products, list):
                return f"Category '{category}' products is not a list"
            
            total_products += len(products)
            print(f"   {category}: {len(products)} products")
            
            # Validate product structure
            for i, product in enumerate(products[:2]):  # Check first 2 products in each category
                required_fields = ['id', 'name', 'price', 'category', 'sku']
                for field in required_fields:
                    if field not in product:
                        return f"Product {i} in {category} missing field: {field}"
                
                # Store product IDs for individual testing
                if product.get('id'):
                    self.product_ids.append(product['id'])
        
        print(f"   Total products found: {total_products}")
        
        if total_products != 42:
            return f"Expected 42 products, found {total_products}"
        
        return True

    def validate_single_product(self, data):
        """Validate single product response"""
        if not isinstance(data, dict):
            return "Response is not a dictionary"
        
        required_fields = ['id', 'name', 'price', 'category', 'sku']
        for field in required_fields:
            if field not in data:
                return f"Missing required field: {field}"
        
        # Check if product has buy links
        buy_links = ['amazonLink', 'flipkartLink', 'meeshoLink']
        has_links = any(data.get(link) for link in buy_links)
        print(f"   Product has buy links: {has_links}")
        
        return True

    def test_products_api(self):
        """Test the main products API"""
        return self.run_test(
            "Get All Products",
            "GET",
            "api/products",
            200,
            validate_func=self.validate_products_structure
        )

    def test_categories_api(self):
        """Test the categories API"""
        def validate_categories(data):
            if not isinstance(data, list):
                return "Response is not a list"
            
            if len(data) == 0:
                return "No categories found"
            
            print(f"   Found {len(data)} categories")
            for category in data:
                if not isinstance(category, dict):
                    return "Category is not a dictionary"
                if 'name' not in category or 'displayName' not in category:
                    return "Category missing name or displayName"
            
            return True
        
        return self.run_test(
            "Get Categories",
            "GET", 
            "api/categories",
            200,
            validate_func=validate_categories
        )

    def test_individual_products(self):
        """Test individual product endpoints"""
        if not self.product_ids:
            print("❌ No product IDs available for individual testing")
            return False
        
        # Test a few sample products
        sample_ids = self.product_ids[:5]  # Test first 5 products
        
        for product_id in sample_ids:
            success, _ = self.run_test(
                f"Get Product {product_id}",
                "GET",
                f"api/product/{product_id}",
                200,
                validate_func=self.validate_single_product
            )
            if not success:
                return False
        
        return True

    def test_category_filtering(self):
        """Test category-specific product endpoints"""
        categories = ['table-lamp', 'garden-lights', 'wall-lights', 'chandelier']
        
        for category in categories:
            def validate_category_products(data):
                if not isinstance(data, list):
                    return f"Category {category} response is not a list"
                
                print(f"   {category}: {len(data)} products")
                
                # Verify all products belong to this category
                for product in data:
                    if product.get('category') != category:
                        return f"Product {product.get('id')} has wrong category: {product.get('category')}"
                
                return True
            
            success, _ = self.run_test(
                f"Get {category} Products",
                "GET",
                f"api/products/{category}",
                200,
                validate_func=validate_category_products
            )
            if not success:
                return False
        
        return True

    def test_nonexistent_product(self):
        """Test 404 handling for non-existent product"""
        return self.run_test(
            "Get Non-existent Product",
            "GET",
            "api/product/NONEXISTENT_ID",
            404
        )

def main():
    print("🚀 Starting Product Catalog API Tests")
    print("=" * 50)
    
    tester = ProductCatalogTester()
    
    # Test sequence
    tests = [
        ("Products API", tester.test_products_api),
        ("Categories API", tester.test_categories_api),
        ("Individual Products", tester.test_individual_products),
        ("Category Filtering", tester.test_category_filtering),
        ("404 Handling", tester.test_nonexistent_product),
    ]
    
    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name} Tests...")
        try:
            success = test_func()
            if not success:
                print(f"❌ {test_name} tests failed")
        except Exception as e:
            print(f"❌ {test_name} tests crashed: {str(e)}")
            tester.failed_tests.append(f"{test_name}: {str(e)}")
    
    # Print results
    print("\n" + "=" * 50)
    print("📊 TEST RESULTS")
    print("=" * 50)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.failed_tests:
        print("\n❌ FAILED TESTS:")
        for failure in tester.failed_tests:
            print(f"  - {failure}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())