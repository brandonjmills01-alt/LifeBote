"""
services/job_data.py
---------------------
100 realistic mock jobs across 10 industries.
Used when no JSearch API key is configured.
Each job is a plain dict matching the JSearch response format
so parse_job_listing() works identically for both real and mock data.
"""

from typing import Any


def _job(
    uid: str, title: str, company: str, city: str, state: str,
    mode: str, sal_min: int, sal_max: int, industry: str, days_ago: int = 3,
) -> dict[str, Any]:
    return {
        "job_id":                     f"mock-{uid}",
        "job_title":                  title,
        "employer_name":              company,
        "job_city":                   city,
        "job_state":                  state,
        "job_is_remote":              mode == "remote",
        "job_work_mode":              mode,
        "job_min_salary":             sal_min,
        "job_max_salary":             sal_max,
        "job_salary_currency":        "USD",
        "job_apply_link":             f"https://jobs.lifebote.com/{uid}",
        "job_posted_at_datetime_utc": f"2025-05-{max(1, 25 - days_ago):02d}T10:00:00Z",
        "industry":                   industry,
        "job_description":            f"We are looking for a talented {title} to join our team at {company}.",
    }


ALL_JOBS: list[dict] = [
    # Technology (15)
    _job("t01","Senior Software Engineer","Stripe","San Francisco","CA","hybrid",155000,210000,"Technology"),
    _job("t02","Python Backend Engineer","Airbnb","Remote","","remote",130000,175000,"Technology"),
    _job("t03","Machine Learning Engineer","OpenAI","San Francisco","CA","hybrid",180000,260000,"Technology"),
    _job("t04","Frontend Engineer (React)","Figma","San Francisco","CA","hybrid",125000,165000,"Technology"),
    _job("t05","DevOps Engineer","Datadog","New York","NY","hybrid",115000,155000,"Technology"),
    _job("t06","Data Scientist","Spotify","Remote","","remote",135000,170000,"Technology"),
    _job("t07","Cloud Solutions Architect","Amazon","Austin","TX","hybrid",150000,200000,"Technology"),
    _job("t08","Cybersecurity Analyst","Palo Alto Networks","Remote","","remote",100000,140000,"Technology"),
    _job("t09","Full Stack Engineer","Linear","Remote","","remote",120000,160000,"Technology"),
    _job("t10","Platform Engineer","Vercel","Remote","","remote",145000,190000,"Technology"),
    _job("t11","AI Research Engineer","Anthropic","San Francisco","CA","hybrid",200000,280000,"Technology"),
    _job("t12","Site Reliability Engineer","Google","Seattle","WA","hybrid",160000,220000,"Technology"),
    _job("t13","Data Engineer","Snowflake","Denver","CO","hybrid",120000,160000,"Technology"),
    _job("t14","QA Engineer","Atlassian","Remote","","remote",95000,130000,"Technology"),
    _job("t15","Technical Program Manager","Microsoft","Redmond","WA","hybrid",145000,195000,"Technology"),
    # Healthcare (10)
    _job("h01","Registered Nurse (ICU)","Mayo Clinic","Rochester","MN","onsite",75000,95000,"Healthcare"),
    _job("h02","Physician Assistant","Kaiser Permanente","Los Angeles","CA","onsite",110000,140000,"Healthcare"),
    _job("h03","Physical Therapist","Select Medical","Atlanta","GA","onsite",75000,95000,"Healthcare"),
    _job("h04","Healthcare Data Analyst","Epic Systems","Madison","WI","hybrid",80000,105000,"Healthcare"),
    _job("h05","Pharmacist","CVS Health","Boston","MA","onsite",120000,145000,"Healthcare"),
    _job("h06","Medical Director","Humana","Remote","","remote",200000,260000,"Healthcare"),
    _job("h07","Clinical Research Coordinator","Pfizer","New York","NY","hybrid",65000,85000,"Healthcare"),
    _job("h08","Nurse Practitioner","Cleveland Clinic","Cleveland","OH","onsite",105000,135000,"Healthcare"),
    _job("h09","Biomedical Engineer","Medtronic","Minneapolis","MN","hybrid",85000,115000,"Healthcare"),
    _job("h10","Mental Health Counselor","BetterHelp","Remote","","remote",60000,80000,"Healthcare"),
    # Finance (10)
    _job("f01","Financial Analyst","Goldman Sachs","New York","NY","onsite",90000,130000,"Finance"),
    _job("f02","Investment Banker","JP Morgan","New York","NY","onsite",150000,200000,"Finance"),
    _job("f03","Quantitative Analyst","Two Sigma","New York","NY","onsite",160000,220000,"Finance"),
    _job("f04","Tax Accountant (CPA)","Deloitte","Chicago","IL","hybrid",75000,105000,"Finance"),
    _job("f05","Portfolio Manager","Vanguard","Malvern","PA","hybrid",130000,175000,"Finance"),
    _job("f06","Compliance Officer","Citibank","New York","NY","hybrid",95000,130000,"Finance"),
    _job("f07","Actuary","Aon","Chicago","IL","hybrid",100000,145000,"Finance"),
    _job("f08","Private Equity Analyst","Blackstone","New York","NY","onsite",120000,170000,"Finance"),
    _job("f09","Financial Controller","Spotify","New York","NY","hybrid",130000,170000,"Finance"),
    _job("f10","Bookkeeper","Bench","Remote","","remote",50000,70000,"Finance"),
    # Education (10)
    _job("e01","High School Math Teacher","Chicago Public Schools","Chicago","IL","onsite",50000,72000,"Education"),
    _job("e02","Instructional Designer","Coursera","Remote","","remote",75000,100000,"Education"),
    _job("e03","Corporate Trainer","Amazon","Seattle","WA","hybrid",80000,110000,"Education"),
    _job("e04","Curriculum Developer","Khan Academy","Remote","","remote",80000,110000,"Education"),
    _job("e05","University Professor (CS)","MIT","Cambridge","MA","onsite",120000,180000,"Education"),
    _job("e06","School Counselor","NYC Dept. of Ed","New York","NY","onsite",60000,82000,"Education"),
    _job("e07","Learning & Development Manager","Google","Mountain View","CA","hybrid",105000,140000,"Education"),
    _job("e08","Special Education Teacher","LAUSD","Los Angeles","CA","onsite",55000,78000,"Education"),
    _job("e09","Education Tech Specialist","Schoology","Remote","","remote",70000,95000,"Education"),
    _job("e10","Academic Advisor","Arizona State Univ.","Tempe","AZ","hybrid",45000,62000,"Education"),
    # Marketing (10)
    _job("m01","Digital Marketing Manager","HubSpot","Boston","MA","hybrid",90000,120000,"Marketing"),
    _job("m02","SEO Specialist","Moz","Remote","","remote",65000,90000,"Marketing"),
    _job("m03","Brand Manager","Procter & Gamble","Cincinnati","OH","hybrid",95000,130000,"Marketing"),
    _job("m04","Content Marketing Lead","Buffer","Remote","","remote",75000,100000,"Marketing"),
    _job("m05","Growth Hacker","Duolingo","Pittsburgh","PA","hybrid",90000,125000,"Marketing"),
    _job("m06","Social Media Manager","Sprout Social","Remote","","remote",60000,85000,"Marketing"),
    _job("m07","Creative Director","TBWA\\Chiat\\Day","Los Angeles","CA","hybrid",120000,175000,"Marketing"),
    _job("m08","Product Marketing Manager","Zoom","San Jose","CA","hybrid",115000,155000,"Marketing"),
    _job("m09","Email Marketing Specialist","Klaviyo","Boston","MA","hybrid",65000,90000,"Marketing"),
    _job("m10","VP of Marketing","Mailchimp","Atlanta","GA","hybrid",160000,220000,"Marketing"),
    # Legal (5)
    _job("l01","Corporate Attorney","Skadden Arps","New York","NY","onsite",200000,280000,"Legal"),
    _job("l02","Paralegal","Littler Mendelson","Chicago","IL","hybrid",55000,80000,"Legal"),
    _job("l03","In-House Counsel","Google","Mountain View","CA","hybrid",170000,230000,"Legal"),
    _job("l04","Privacy Counsel","Meta","Menlo Park","CA","hybrid",180000,250000,"Legal"),
    _job("l05","Contract Manager","Lockheed Martin","Bethesda","MD","hybrid",90000,125000,"Legal"),
    # Construction (5)
    _job("c01","Civil Engineer","AECOM","Los Angeles","CA","hybrid",85000,120000,"Construction"),
    _job("c02","Construction Project Manager","Turner Construction","New York","NY","onsite",95000,135000,"Construction"),
    _job("c03","Structural Engineer","Thornton Tomasetti","New York","NY","hybrid",90000,130000,"Construction"),
    _job("c04","HVAC Technician","Comfort Systems","Dallas","TX","onsite",55000,78000,"Construction"),
    _job("c05","BIM Coordinator","Gilbane Building","Boston","MA","hybrid",75000,105000,"Construction"),
    # Retail (5)
    _job("r01","E-Commerce Manager","Walmart","Bentonville","AR","hybrid",90000,120000,"Retail"),
    _job("r02","Supply Chain Analyst","Amazon","Seattle","WA","hybrid",75000,105000,"Retail"),
    _job("r03","Shopify Developer","Shopify","Remote","","remote",95000,135000,"Retail"),
    _job("r04","Category Manager","Procter & Gamble","Cincinnati","OH","hybrid",95000,130000,"Retail"),
    _job("r05","Retail Store Manager","Target","Minneapolis","MN","onsite",65000,90000,"Retail"),
    # Non-Profit (5)
    _job("np01","Executive Director","United Way","Alexandria","VA","hybrid",100000,145000,"Non-Profit"),
    _job("np02","Grant Writer","Red Cross","Remote","","remote",55000,80000,"Non-Profit"),
    _job("np03","Program Manager","Habitat for Humanity","Atlanta","GA","hybrid",60000,85000,"Non-Profit"),
    _job("np04","Development Director","YMCA","Chicago","IL","onsite",75000,105000,"Non-Profit"),
    _job("np05","Data Analyst","Gates Foundation","Seattle","WA","hybrid",80000,110000,"Non-Profit"),
    # Media (5)
    _job("me01","Video Editor","Netflix","Los Angeles","CA","hybrid",80000,120000,"Media"),
    _job("me02","Journalist","New York Times","New York","NY","hybrid",65000,95000,"Media"),
    _job("me03","Game Designer","Riot Games","Los Angeles","CA","hybrid",100000,145000,"Media"),
    _job("me04","Graphic Designer","Adobe","Remote","","remote",65000,95000,"Media"),
    _job("me05","Streaming Analytics Manager","Hulu","Santa Monica","CA","hybrid",105000,145000,"Media"),
    # Aerospace & Defense (5)
    _job("ad01","Aerospace Engineer","Boeing","Huntsville","AL","onsite",100000,150000,"Aerospace"),
    _job("ad02","Defense Program Manager","Lockheed Martin","Bethesda","MD","hybrid",130000,185000,"Aerospace"),
    _job("ad03","Satellite Systems Engineer","SpaceX","Hawthorne","CA","onsite",120000,175000,"Aerospace"),
    _job("ad04","UAV Engineer","Shield AI","San Diego","CA","onsite",120000,175000,"Aerospace"),
    _job("ad05","Cybersecurity Engineer (DoD)","Leidos","Reston","VA","hybrid",115000,165000,"Aerospace"),
    # Energy (5)
    _job("en01","Petroleum Engineer","ExxonMobil","Houston","TX","onsite",110000,165000,"Energy"),
    _job("en02","Solar Energy Consultant","SunPower","Remote","","remote",70000,100000,"Energy"),
    _job("en03","EV Battery Engineer","Tesla Energy","Austin","TX","hybrid",110000,155000,"Energy"),
    _job("en04","Renewable Energy PM","NextEra Energy","Juno Beach","FL","hybrid",100000,145000,"Energy"),
    _job("en05","Sustainability Manager","Apple","Cupertino","CA","hybrid",105000,145000,"Energy"),
    # Human Resources (5)
    _job("hr01","Talent Acquisition Manager","Google","Mountain View","CA","hybrid",110000,155000,"Human Resources"),
    _job("hr02","HR Business Partner","Amazon","Seattle","WA","hybrid",100000,140000,"Human Resources"),
    _job("hr03","People Operations Manager","Airbnb","Remote","","remote",105000,150000,"Human Resources"),
    _job("hr04","Diversity & Inclusion Manager","Apple","Cupertino","CA","hybrid",110000,155000,"Human Resources"),
    _job("hr05","Compensation Analyst","Radford","Remote","","remote",85000,115000,"Human Resources"),
    # Consulting (5)
    _job("co01","Management Consultant","McKinsey","New York","NY","hybrid",150000,220000,"Consulting"),
    _job("co02","IT Consultant","Accenture","Chicago","IL","hybrid",105000,150000,"Consulting"),
    _job("co03","Digital Transformation Lead","Deloitte Digital","New York","NY","hybrid",130000,185000,"Consulting"),
    _job("co04","Salesforce Consultant","Slalom","Remote","","remote",100000,145000,"Consulting"),
    _job("co05","Agile Coach","ThoughtWorks","Remote","","remote",110000,155000,"Consulting"),
]
