# Test the final improved author matching logic
def extract_surname(author_name):
    """Extract surname from author name, handling various formats."""
    if not author_name:
        return ""
    
    name = str(author_name).strip().lower()
    
    # Remove titles like Prof, Dr, Mr, Mrs, Ms
    name = name.replace('prof.', '').replace('prof ', '').replace('dr.', '').replace('dr ', '')
    name = name.replace('mr.', '').replace('mr ', '').replace('mrs.', '').replace('mrs ', '')
    name = name.replace('ms.', '').replace('ms ', '')
    
    # Split into parts and take the last part as surname
    parts = name.split()
    if len(parts) == 0:
        return ""
    elif len(parts) == 1:
        return parts[0]
    else:
        # For multi-part names, the last part is usually the surname
        surname = parts[-1]
        # Handle cases like "van der Walt" - take last 2 parts if surname is very short
        if len(surname) <= 2 and len(parts) >= 2:
            surname = parts[-2] + " " + surname
        return surname

def check_author_match(search_authors, dhet_authors):
    """Check if search authors match DHET authors using improved fuzzy matching."""
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
        
        # Calculate matching percentage using improved matching
        matches = 0
        for search_author in search_author_list:
            for dhet_auth in dhet_author_list:
                # Extract surnames for comparison
                search_surname = extract_surname(search_author)
                dhet_surname = extract_surname(dhet_auth)
                
                # Check for exact surname match (highest priority)
                if search_surname and dhet_surname and search_surname == dhet_surname:
                    matches += 1
                    break
                # Check for substring match (fallback)
                elif search_author in dhet_auth or dhet_auth in search_author:
                    matches += 1
                    break
        
        # Calculate similarity as percentage of search authors that matched
        if len(search_author_list) > 0:
            similarity = matches / len(search_author_list)
            # More flexible matching: if we have at least one strong surname match, 
            # lower the threshold to 50% for partial matches
            has_surname_match = any(
                extract_surname(sa) == extract_surname(da) 
                for sa in search_author_list 
                for da in dhet_author_list
            )
            threshold = 0.5 if has_surname_match else 0.85
            if similarity >= threshold:
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

# Test some other cases
test_cases = [
    ('J Smith', 'Prof John Smith'),
    ('A Johnson; B Williams', 'Dr. Alan Johnson'),
    ('P van der Walt', 'Prof Peter van der Walt'),
    ('M Singh', 'Dr. Singh'),
]

print('Additional test cases:')
for search_authors, dhet_author in test_cases:
    similarity, match = check_author_match(search_authors, [dhet_author])
    print(f'  "{search_authors}" vs "{dhet_author}" -> similarity: {similarity}')
