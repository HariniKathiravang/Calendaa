import sys
from importlib.metadata import version, PackageNotFoundError
import re

def check_requirements(requirements_file):
    with open(requirements_file, 'r') as f:
        requirements = f.read().splitlines()

    missing = []
    for req in requirements:
        if not req.strip() or req.startswith('#'):
            continue
        
        # Parse basic requirement, e.g., 'fastapi==0.115.5' or 'python-jose[cryptography]==3.3.0'
        # Strip off extras like [cryptography] for the package name check
        match = re.match(r'^([a-zA-Z0-9_\-]+)(?:\[.*?\])?(.*)$', req)
        if not match:
            missing.append(f"{req} (Could not parse)")
            continue
            
        pkg_name = match.group(1)
        version_spec = match.group(2).strip()

        try:
            installed_version = version(pkg_name)
            # Extremely basic check: if there's ==, check if it matches
            if '==' in version_spec:
                req_version = version_spec.split('==')[1].strip()
                if installed_version != req_version:
                    missing.append(f"{req} (Found {installed_version} but expected {req_version})")
        except PackageNotFoundError:
            missing.append(f"{req} (Not Found)")

    if missing:
        print(f"Missing in {requirements_file}:")
        for m in missing:
            print(f"  - {m}")
    else:
        print(f"All requirements in {requirements_file} are satisfied.")

if __name__ == '__main__':
    check_requirements(sys.argv[1])
