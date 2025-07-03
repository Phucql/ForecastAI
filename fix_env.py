#!/usr/bin/env python3
"""
Script to check and fix .env file encoding issues
"""

import os
import sys

def check_and_fix_env():
    env_file = '.env'
    
    if not os.path.exists(env_file):
        print(f"❌ {env_file} file not found")
        return False
    
    try:
        # Try to read with UTF-8
        with open(env_file, 'r', encoding='utf-8') as f:
            content = f.read()
        print(f"✅ {env_file} is valid UTF-8")
        return True
    except UnicodeDecodeError as e:
        print(f"❌ {env_file} has encoding issues: {e}")
        
        # Try to read with different encodings
        encodings = ['latin1', 'cp1252', 'utf-8-sig', 'utf-16']
        
        for encoding in encodings:
            try:
                with open(env_file, 'r', encoding=encoding) as f:
                    content = f.read()
                print(f"✅ {env_file} can be read with {encoding}")
                
                # Rewrite the file with proper UTF-8 encoding
                with open(env_file, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"✅ {env_file} has been rewritten with UTF-8 encoding")
                return True
                
            except UnicodeDecodeError:
                continue
        
        print(f"❌ Could not read {env_file} with any encoding")
        return False

if __name__ == "__main__":
    success = check_and_fix_env()
    sys.exit(0 if success else 1) 