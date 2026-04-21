# Test the author matching logic directly
def check_author_match(search_authors, dhet_authors):
    """Check if search authors match DHET authors using fuzzy matching."""
    if not search_authors:
        return 0.0, None
    
    search_authors_str = str(search_authors).strip().lower()
    if not search_authors_str:
        return 0.0, None
    
    # Split search authors by common separators
    search_author_list = [a.strip() for a in search_authors_str.replace(';', ',').split(',') if a.strip()]
    
    for i, dhet_author in enumerate(dhet_authors):
        if not dhet_author:
            continue
        
        dhet_author_lower = str(dhet_author).strip().lower()
        dhet_author_list = [a.strip() for a in dhet_author_lower.replace(';', ',').split(',') if a.strip()]
        
        # Calculate matching percentage
        matches = 0
        for search_author in search_author_list:
            for dhet_auth in dhet_author_list:
                # Check for substring match or exact match
                if search_author in dhet_auth or dhet_auth in search_author:
                    matches += 1
                    break
        
        # Calculate similarity as percentage of search authors that matched
        if len(search_author_list) > 0:
            similarity = matches / len(search_author_list)
            if similarity >= 0.85:
                return similarity, dhet_author
    
    return 0.0, None

# Test with the actual data
search_authors = 'AL Shokane; MA Masoga'
dhet_authors = ['Prof Lulu Shokane', 'AOSIS']

print(f'Search authors: {search_authors}')
print(f'DHET authors: {dhet_authors}')
print()

similarity, match = check_author_match(search_authors, dhet_authors)
print(f'Author similarity: {similarity}')
print(f'Matched with: {match}')
print()

# Let's debug step by step
search_authors_str = str(search_authors).strip().lower()
print(f'Search authors (lower): {search_authors_str}')

search_author_list = [a.strip() for a in search_authors_str.replace(';', ',').split(',') if a.strip()]
print(f'Search author list: {search_author_list}')

for i, dhet_author in enumerate(dhet_authors):
    print(f'\nTesting DHET author {i}: {dhet_author}')
    if not dhet_author:
        continue
    
    dhet_author_lower = str(dhet_author).strip().lower()
    dhet_author_list = [a.strip() for a in dhet_author_lower.replace(';', ',').split(',') if a.strip()]
    print(f'  DHET author list: {dhet_author_list}')
    
    matches = 0
    for search_author in search_author_list:
        for dhet_auth in dhet_author_list:
            print(f'    Comparing "{search_author}" with "{dhet_auth}"')
            if search_author in dhet_auth or dhet_auth in search_author:
                print(f'      -> MATCH!')
                matches += 1
                break
            else:
                print(f'      -> no match')
    
    if len(search_author_list) > 0:
        similarity = matches / len(search_author_list)
        print(f'  Similarity: {similarity} (matches: {matches}, total: {len(search_author_list)})')
        print(f'  Above threshold: {similarity >= 0.85}')
