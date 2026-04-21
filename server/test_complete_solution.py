# Test the complete solution by simulating the DHET approval check
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the updated functions from recommend.py
from scripts.recommend import check_author_match, check_dhet_approval

def test_author_matching():
    """Test the improved author matching with the actual case"""
    print("=== Testing Author Matching ===")
    
    # Test case from the user's issue
    search_authors = 'AL Shokane; MA Masoga'
    dhet_authors = ['Prof Lulu Shokane', 'AOSIS']
    
    print(f"Search authors: {search_authors}")
    print(f"DHET authors: {dhet_authors}")
    
    similarity, match = check_author_match(search_authors, dhet_authors)
    print(f"Author similarity: {similarity}")
    print(f"Matched with: {match}")
    print()
    
    # Test additional cases
    test_cases = [
        ('J Smith', ['Prof John Smith']),
        ('A Johnson; B Williams', ['Dr. Alan Johnson']),
        ('P van der Walt', ['Prof Peter van der Walt']),
        ('M Singh', ['Dr. Singh']),
        ('AL Shokane', ['Prof Lulu Shokane']),  # Single author case
    ]
    
    print("Additional test cases:")
    for search_authors, dhet_authors in test_cases:
        similarity, match = check_author_match(search_authors, dhet_authors)
        print(f"  \"{search_authors}\" vs \"{dhet_authors[0]}\" -> similarity: {similarity:.3f}, match: {match}")
    print()

def test_dhet_approval_simulation():
    """Simulate a DHET approval check with the user's data"""
    print("=== Testing DHET Approval Simulation ===")
    
    # Simulate the user's case
    search_texts = ["Navigating the complex landscape of African thought"]
    venues = ["Inkanyiso"]
    authors = ["AL Shokane; MA Masoga"]
    
    print(f"Search text: {search_texts[0]}")
    print(f"Venue: {venues[0]}")
    print(f"Authors: {authors[0]}")
    print()
    
    # This would normally call the DHET approval service, but we'll simulate the result
    # based on our improved matching logic
    
    # Test author matching
    from scripts.recommend import load_dhet_cache
    cache = load_dhet_cache()
    
    if cache["loaded"]:
        author_similarity, author_match = check_author_match(authors[0], cache["authors"])
        print(f"Author similarity: {author_similarity}")
        print(f"Author match: {author_match}")
        
        # Find the matching DHET entry
        if author_match:
            print(f"Found DHET entry with author: {author_match}")
            
            # Find the corresponding title and venue
            author_index = cache["authors"].index(author_match) if author_match in cache["authors"] else -1
            if author_index >= 0:
                dhet_title = cache["titles"][author_index]
                dhet_venue = cache["venues"][author_index]
                print(f"DHET title: {dhet_title}")
                print(f"DHET venue: {dhet_venue}")
                
                # Check venue matching
                from scripts.recommend import check_venue_match
                venue_similarity, venue_match = check_venue_match(venues[0], cache["venues"], cache["titles"])
                print(f"Venue similarity: {venue_similarity}")
                print(f"Venue match: {venue_match}")
    else:
        print("DHET cache not loaded")
    
    print()

if __name__ == "__main__":
    try:
        test_author_matching()
        test_dhet_approval_simulation()
        print("=== Test completed successfully ===")
    except Exception as e:
        print(f"Test failed with error: {e}")
        import traceback
        traceback.print_exc()
