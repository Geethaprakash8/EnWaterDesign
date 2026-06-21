import os
import re

root_dir = r"d:\Project Check"

footer_pat = re.compile(r'<footer\b.*?</footer>', re.DOTALL)

updated = 0
total = 0

for root, dirs, files in os.walk(root_dir):
    if "node_modules" in dirs:
        dirs.remove("node_modules")
    for file in files:
        if file.endswith(".html") and file != "index.html":
            total += 1
            file_path = os.path.join(root, file)
            
            # Determine prefix
            rel_path = os.path.relpath(file_path, root_dir)
            parts = rel_path.replace("\\", "/").split("/")
            depth = len(parts) - 1
            prefix = "../" * depth
            
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()
                
            if footer_pat.search(content):
                # Build the premium footer HTML
                premium_footer = f"""<footer class="footer">
<div class="wrap">
<div class="footer-top">
<div>
<div class="footer-brand"><img alt="EnWater Design logo" class="footer-logo" src="{prefix}assets/images/enwater-design-logo-transparent-mark.png"/><span class="footer-name">EnWater Design</span></div>
<p class="footer-desc">Independent water, wastewater treatment and reuse consulting, helping owners and operators turn complex challenges into clear decisions and practical outcomes.</p>
</div>
<div class="footer-col">
<h4>Explore</h4>
<a href="{prefix}home.html">Home</a>
<a href="{prefix}About/about.html">About</a>
<a href="{prefix}About/BlogList.html">Our Blog</a>
<a href="{prefix}How We Engage/How We Engage with EnWater Design/how-we-engage-with-enwater-design.html">How We Engage</a>
</div>
<div class="footer-col">
<h4>Services</h4>
<a href="{prefix}Advisory/solution-advisory.html">Solution Advisory</a>
<a href="{prefix}design-sourcing/index.html">Design &amp; Sourcing</a>
<a href="{prefix}FlowPlan/flowplan-framework.html">FlowPlan</a>
<a href="{prefix}Projects/index.html">Projects</a>
<a href="{prefix}Sectors/index.html">Sectors</a>
</div>
<div class="footer-col">
<h4>Pathways</h4>
<a href="{prefix}How We Engage/Process Design &amp; Troubleshooting/process-design-troubleshooting-delivery-support.html">Process Design &amp; Troubleshooting</a>
<a href="{prefix}design-sourcing/baseline-diagnostics-planning.html">Baseline Diagnostics</a>
<a href="{prefix}FlowPlan/treatment-reuse-planning.html">Reuse Planning</a>
<a href="{prefix}FlowPlan/flowplan-systems-planning.html">Systems Planning</a>
<a href="{prefix}Sectors/index.html">Sector Pathways</a>
</div>
<div class="footer-col">
<h4>Get in touch</h4>
<a href="{prefix}get-in-touch.html">Contact form</a>
<a href="{prefix}Sectors/vehicle-wash-car-wash.html">Vehicle wash / car wash</a>
<a href="{prefix}Sectors/hotels-commercial-towers.html">Hotels &amp; commercial towers</a>
<a href="{prefix}Sectors/food-beverage-processing.html">Food &amp; beverage processing</a>
<a href="{prefix}Sectors/common-effluent-plant-cetp-industrial-parks.html">Industrial / CETP</a>
</div>
</div>
<div class="footer-bottom">
<div>© <span id="yr"></span> EnWater Design</div>
<div>Clear systems planning for practical project delivery</div>
</div>
</div>
<script>
  (function() {{
    const yr = document.getElementById('yr');
    if (yr) yr.textContent = new Date().getFullYear();
  }})();
</script>
</footer>"""
                
                # Replace the footer
                content = footer_pat.sub(premium_footer, content)
                
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(content)
                updated += 1
                print(f"Updated footer in: {rel_path}")

print(f"Processed {total} files. Updated {updated} files.")
