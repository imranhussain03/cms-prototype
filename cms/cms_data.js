/**
 * Innomick Technologies - Contract Management System (CMS) Mock Database
 * Strictly confidential & sanitized: tailored specifically for Innomick Technologies
 * Enterprise IT, Cloud Consulting, Software Licensing, and Vendor SOWs.
 */

const InnomickCMSData = {
  currentUser: {
    name: "Imran Hussain",
    title: "Lead Cloud Solutions Consultant",
    department: "Information Technology",
    email: "imran.h@innomicktechnologies.com",
    avatar: "IH",
    role: "Contract Owner / Approver"
  },

  branches: [
    "Innomick",
    "Innomick Dubai HQ (UAE)",
    "Innomick Kuwait Tech Hub",
    "Innomick Riyadh Regional Office (KSA)",
    "Innomick Singapore APAC Center"
  ],

  departments: [
    "Information Technology",
    "Medical Insurance",
    "Facilities Management"
  ],

  vendors: [
    "Innomick",
    "Gulf Office Supplies",
    "Innomick Solutions",
    "Alpha Tech",
    "Unknown Vendor",
    "Delta Engineering",
    "Orbit Networks",
    "Zenith Facility Services",
    "Metro Cleaning Solutions",
    "Microsoft Corporation (Azure & M365)",
    "Amazon Web Services (AWS Enterprise)",
    "Oracle Cloud Infrastructure (OCI)",
    "Cisco Systems International",
    "Datadog Cloud Monitoring",
    "Palo Alto Networks",
    "Snowflake Data Cloud",
    "MongoDB Atlas Services"
  ],

  contractTypes: [
    "Master Services Agreement (MSA)",
    "Cloud Infrastructure Provider SLA",
    "Enterprise Software License",
    "Vendor Statement of Work (SOW)",
    "SaaS Subscription Agreement",
    "Data Processing & DLP Addendum (DPA)",
    "Non-Disclosure Agreement (NDA)",
    "Hardware Maintenance & Support"
  ],

  categories: [
    "Service",
    "Purchase",
    "Construction"
  ],

  // 1. KPI Statistics (Matching Live SharePoint Dashboard)
  statistics: {
    pendingApprovals: 88,
    expiringSoon: 0,
    stuckApprovals: 88,
    draftsAging: 18,
    pendingExecution: 0,
    noticePeriod: 0,
    totalActiveContracts: 42,
    totalContractValueUSD: "10,245,000 KWD",
    annualSpendUSD: "4,820,000 KWD"
  },

  // 2. Action Required - Pending For Your Approvals (Count: 115)
  pendingApprovalsList: [
    {
      id: "PND-01",
      title: "Printer Fleet Management",
      daysAgo: "37d →",
      code: "INM/ITD/SVC/2598/2026",
      type: "Service",
      department: "Information Technology",
      vendor: "Gulf Office Supplies",
      amount: "4,500 KWD"
    },
    {
      id: "PND-02",
      title: "Courier Services",
      daysAgo: "38d →",
      code: "INM/ITD/SVC/2586/2026",
      type: "Service",
      department: "Information Technology",
      vendor: "Innomick",
      amount: "451 KWD"
    },
    {
      id: "PND-03",
      title: "Crescent Software",
      daysAgo: "67d →",
      code: "INM/ITD/SVC/2519/2026",
      type: "Service",
      department: "Information Technology",
      vendor: "Crescent Software",
      amount: "7,889,562 KWD"
    },
    {
      id: "PND-04",
      title: "Security Guard Services",
      daysAgo: "97d →",
      code: "INM/MID/SVC/001/2026",
      type: "Service",
      department: "Medical Insurance",
      vendor: "Innomick",
      amount: "1,000 KWD"
    },
    {
      id: "PND-05",
      title: "Security Guard Services",
      daysAgo: "97d →",
      code: "INM/MID/SVC/001/2026",
      type: "Service",
      department: "Medical Insurance",
      vendor: "Innomick",
      amount: "1,000 KWD"
    },
    {
      id: "PND-06",
      title: "Vertex Supplies",
      daysAgo: "102d →",
      code: "INM/CUS/SVC/2431/2026",
      type: "Service",
      department: "Information Technology",
      vendor: "Vertex Supplies",
      amount: "789 KWD"
    },
    {
      id: "PND-07",
      title: "Secure Mail Gateway",
      daysAgo: "104d →",
      code: "INM/ITD/SVC/2360/2026",
      type: "Service",
      department: "Information Technology",
      vendor: "Secure Mail Gateway",
      amount: "789 KWD"
    },
    {
      id: "PND-08",
      title: "Vendor Portal Subscription",
      daysAgo: "106d →",
      code: "INM/MID/SVC/2354/2026",
      type: "Service",
      department: "Medical Insurance",
      vendor: "Innomick",
      amount: "1,000 KWD"
    }
  ],

  // 3. Stuck Approvals (Count: 112)
  stuckApprovalsList: [
    {
      id: "STK-01",
      title: "Printer Fleet Management",
      type: "Service",
      department: "Information Technology",
      vendor: "Gulf Office Supplies",
      amount: "4,500 KWD",
      daysAgo: "35d →",
      step: "Manager Approval",
      approver: "Sara Thomas"
    },
    {
      id: "STK-02",
      title: "Courier Services",
      type: "Service",
      department: "Information Technology",
      vendor: "Innomick",
      amount: "451 KWD",
      daysAgo: "36d →",
      step: "Manager Approval",
      approver: "Sara Thomas"
    },
    {
      id: "STK-03",
      title: "Crescent Software",
      type: "Service",
      department: "Information Technology",
      vendor: "Crescent Software",
      amount: "7,889,562 KWD",
      daysAgo: "65d →",
      step: "Manager Approval",
      approver: "Sara Thomas"
    },
    {
      id: "STK-04",
      title: "Security Guard Services",
      type: "Service",
      department: "Medical Insurance",
      vendor: "Innomick",
      amount: "1,000 KWD",
      daysAgo: "95d →",
      step: "Approval by Sara Thomas",
      approver: "Sara Thomas"
    },
    {
      id: "STK-05",
      title: "Security Guard Services",
      type: "Service",
      department: "Medical Insurance",
      vendor: "Innomick",
      amount: "1,000 KWD",
      daysAgo: "95d →",
      step: "CEO",
      approver: "Sara Thomas"
    },
    {
      id: "STK-06",
      title: "Vertex Supplies",
      type: "Service",
      department: "Information Technology",
      vendor: "Vertex Supplies",
      amount: "789 KWD",
      daysAgo: "100d →",
      step: "Approval by Sara Thomas",
      approver: "Sara Thomas"
    },
    {
      id: "STK-07",
      title: "Prime Logistics",
      type: "Service",
      department: "Medical Insurance",
      vendor: "Prime Logistics",
      amount: "986,532 KWD",
      daysAgo: "106d →",
      step: "Approval by Sara Thomas",
      approver: "Sara Thomas"
    },
    {
      id: "STK-08",
      title: "HVAC Maintenance",
      type: "Service",
      department: "Medical Insurance",
      vendor: "Innomick",
      amount: "9,856 KWD",
      daysAgo: "106d →",
      step: "Approval by Sara Thomas",
      approver: "Sara Thomas"
    },
    {
      id: "STK-09",
      title: "Mobile Device Management",
      type: "Service",
      department: "Medical Insurance",
      vendor: "Nova Trading Co.",
      amount: "26,464 KWD",
      daysAgo: "106d →",
      step: "Approval by Sara Thomas",
      approver: "Sara Thomas"
    },
    {
      id: "STK-10",
      title: "Lab Equipment Calibration",
      type: "Service",
      department: "Medical Insurance",
      vendor: "Nova Trading Co.",
      amount: "10,000 KWD",
      daysAgo: "106d →",
      step: "Approval by Sara Thomas",
      approver: "Sara Thomas"
    },
    {
      id: "STK-11",
      title: "Contract Active",
      type: "Service",
      department: "Medical Insurance",
      vendor: "Contract Active",
      amount: "986,532 KWD",
      daysAgo: "107d →",
      step: "Approval by Sara Thomas",
      approver: "Sara Thomas"
    }
  ],

  // 4. Drafts Aging (Count: 13)
  draftsAgingList: [
    {
      id: "DFT-01",
      title: "Untitled Contract",
      type: "Service",
      department: "Information Technology",
      vendor: "",
      amount: "",
      daysAgo: "10 days →"
    },
    {
      id: "DFT-02",
      title: "IT Support Services Agreement",
      type: "Service",
      vendor: "Alpha Tech",
      department: "Information Technology",
      amount: "25,000 KWD",
      daysAgo: "20 days →"
    },
    {
      id: "DFT-03",
      title: "IT Support Services Agreement",
      type: "Service",
      vendor: "Alpha Tech",
      department: "Information Technology",
      amount: "30,000 KWD",
      daysAgo: "20 days →"
    },
    {
      id: "DFT-04",
      title: "Alpha Gen",
      type: "Service",
      vendor: "Delta Engineering",
      department: "Information Technology",
      amount: "2,000 KWD",
      daysAgo: "20 days →"
    }
  ],

  // Legacy Action Required Items (Dashboard)
  actionRequiredItems: [
    {
      id: "ACT-101",
      contractId: "CNT-2026-089",
      title: "AWS Enterprise Cloud Compute Reserve 2026-2029",
      type: "Master Services Agreement (MSA)",
      vendor: "Amazon Web Services (AWS Enterprise)",
      amount: "$420,000",
      urgency: "High",
      dueDate: "Tomorrow at 17:00",
      action: "Final Financial Approval Required"
    }
  ],

  // 5. Contracts List (Includes 4 SharePoint Contracts matching Screenshot 01)
  contracts: [
    {
      id: "CNT-SP-01",
      refNo: "Innomick Services/751771134",
      code: "Innomick Services/751771134",
      contractName: "Innomick Services",
      name: "Innomick Services",
      hasIcon: true,
      status: "Expired",
      vendorName: "Innomick",
      vendor: "Innomick",
      department: "Information Technology",
      durationMonths: "10 Months",
      durationDates: "23 May 23 - 22 Mar 24",
      durationProgress: 100,
      contractValue: "9,000",
      value: 9000,
      currency: "KWD",
      category: "Service",
      type: "Service Agreement",
      branch: "Innomick",
      owner: "Sara Thomas",
      description: "Enterprise IT support & consulting services agreement.",
      versions: [
        { no: "1.0", date: "23 May 2023", user: "Sara Thomas", comment: "Initial execution" }
      ]
    },
    {
      id: "CNT-SP-02",
      refNo: "INM/ITD/SVC/2598/2026",
      code: "INM/ITD/SVC/2598/2026",
      contractName: "Printer Fleet Management",
      name: "Printer Fleet Management",
      hasIcon: false,
      status: "Archived",
      vendorName: "Gulf Office Supplies",
      vendor: "Gulf Office Supplies",
      department: "Information Technology",
      durationMonths: "0 Month",
      durationDates: "19 Sept 26 - 30 Sept 26",
      durationProgress: 95,
      contractValue: "4,500",
      value: 4500,
      currency: "KWD",
      category: "Service",
      type: "Service Agreement",
      branch: "Innomick",
      owner: "Sara Thomas",
      description: "IT Department templated amendment agreement.",
      versions: [
        { no: "1.0", date: "19 Sep 2026", user: "Sara Thomas", comment: "Archived after term" }
      ]
    },
    {
      id: "CNT-SP-03",
      refNo: "INM/ITD/SVC/2551/2026",
      code: "INM/ITD/SVC/2551/2026",
      contractName: "Cloud Backup Service",
      name: "Cloud Backup Service",
      hasIcon: false,
      status: "Archived",
      vendorName: "Innomick Solutions",
      vendor: "Innomick Solutions",
      department: "Information Technology",
      durationMonths: "1 Month",
      durationDates: "26 Aug 26 - 30 Sept 26",
      durationProgress: 90,
      contractValue: "70,000",
      value: 70000,
      currency: "KWD",
      category: "Service",
      type: "Service Agreement",
      branch: "Innomick",
      owner: "Sara Thomas",
      description: "User acceptance testing demonstration and sandbox support agreement.",
      versions: [
        { no: "1.0", date: "26 Aug 2026", user: "Sara Thomas", comment: "Archived on completion" }
      ]
    },
    {
      id: "CNT-SP-04",
      refNo: "INM/ITD/SVC/2552/2026",
      code: "INM/ITD/SVC/2552/2026",
      contractName: "Annual Network Audit",
      name: "Annual Network Audit",
      hasIcon: false,
      status: "Expired",
      vendorName: "Innomick",
      vendor: "Innomick",
      department: "Information Technology",
      durationMonths: "1 Month",
      durationDates: "26 Sept 26 - 10 Oct 26",
      durationProgress: 100,
      contractValue: "450,000",
      value: 450000,
      currency: "KWD",
      category: "Service",
      type: "Service Agreement",
      branch: "Innomick",
      owner: "Sara Thomas",
      description: "Corporate IT renewal contract for Innomick infrastructure.",
      versions: [
        { no: "1.0", date: "26 Sep 2026", user: "Sara Thomas", comment: "Expired term" }
      ]
    },
    {
      id: "CNT-SP-05",
      refNo: "INM/MID/SVC/2622/2026",
      code: "INM/MID/SVC/2622/2026",
      contractName: "Medical Equipment Maintenance",
      name: "Medical Equipment Maintenance",
      hasIcon: false,
      status: "Expired",
      vendorName: "Innomick",
      vendor: "Innomick",
      department: "Medical Insurance",
      durationMonths: "1 Month",
      durationDates: "23 Sept 26 - 23 Oct 26",
      durationProgress: 100,
      contractValue: "1,000",
      value: 1000,
      currency: "KWD",
      category: "Service",
      type: "Service Agreement",
      branch: "Innomick",
      owner: "Arjun Mehta",
      description: "Medical Insurance cancellation test agreement."
    },
    {
      id: "CNT-SP-06",
      refNo: "INM/MID/SVC/2608/2026",
      code: "INM/MID/SVC/2608/2026",
      contractName: "Pharmacy Software License",
      name: "Pharmacy Software License",
      hasIcon: false,
      status: "Expired",
      vendorName: "Innomick",
      vendor: "Innomick",
      department: "Medical Insurance",
      durationMonths: "0 Month",
      durationDates: "23 Oct 26 - 26 Oct 26",
      durationProgress: 100,
      contractValue: "20,001",
      value: 20001,
      currency: "KWD",
      category: "Service",
      type: "Service Agreement",
      branch: "Innomick",
      owner: "Arjun Mehta",
      description: "Automated smoke testing services contract."
    },
    {
      id: "CNT-SP-07",
      refNo: "Innomick IT Contract/88555232",
      code: "Innomick IT Contract/88555232",
      contractName: "Innomick IT Contract",
      name: "Innomick IT Contract",
      hasIcon: true,
      status: "Expired",
      vendorName: "Innomick Partners Pvt.",
      vendor: "Innomick Partners Pvt.",
      department: "Medical Insurance",
      durationMonths: "11 Months",
      durationDates: "23 Mar 24 - 21 Feb 25",
      durationProgress: 100,
      contractValue: "10,000",
      value: 10000,
      currency: "KWD",
      category: "Service",
      type: "IT Support SLA",
      branch: "Innomick",
      owner: "Arjun Mehta",
      description: "Innomick IT services support contract."
    },
    {
      id: "CNT-SP-08",
      refNo: "INM/MID/SVC/2529/2026",
      code: "INM/MID/SVC/2529/2026",
      contractName: "Office Furniture Supply",
      name: "Office Furniture Supply",
      hasIcon: false,
      status: "Archived",
      vendorName: "Office Furniture Supply",
      vendor: "Office Furniture Supply",
      department: "Medical Insurance",
      durationMonths: "0 Month",
      durationDates: "05 Aug 26 - 06 Aug 26",
      durationProgress: 100,
      contractValue: "8,000",
      value: 8000,
      currency: "KWD",
      category: "Service",
      type: "Service Agreement",
      branch: "Innomick",
      owner: "Arjun Mehta",
      description: "Test open contract archived on term completion."
    },
    {
      id: "CNT-SP-09",
      refNo: "INM/MID/SVC/2546/2026",
      code: "INM/MID/SVC/2546/2026",
      contractName: "Apex Medical Supplies",
      name: "Apex Medical Supplies",
      hasIcon: false,
      status: "Expired",
      vendorName: "Apex Medical Supplies",
      vendor: "Apex Medical Supplies",
      department: "Medical Insurance",
      durationMonths: "0 Month",
      durationDates: "06 Aug 26 - 07 Aug 26",
      durationProgress: 100,
      contractValue: "9,666",
      value: 9666,
      currency: "KWD",
      category: "Service",
      type: "Service Agreement",
      branch: "Innomick",
      owner: "Arjun Mehta",
      description: "Regression testing SLA agreement."
    },
    {
      id: "CNT-2026-089",
      code: "INM-AWS-2026-V1",
      name: "AWS Enterprise Cloud Compute Reserve Agreement",
      vendor: "Amazon Web Services (AWS Enterprise)",
      category: "Service",
      type: "Master Services Agreement (MSA)",
      branch: "Innomick Dubai HQ (UAE)",
      department: "Information Technology",
      value: 420000,
      currency: "USD",
      startDate: "01 Nov 2026",
      endDate: "31 Oct 2029",
      status: "Active",
      owner: "Imran Hussain",
      description: "Direct reserve instance agreement for multi-region Kubernetes clusters and database backends.",
      versions: [
        { no: "1.2", date: "12 Oct 2026", user: "Imran Hussain", comment: "Commercial term discount renegotiated to 18%" },
        { no: "1.0", date: "15 Sep 2026", user: "Finance Team", comment: "Initial submission" }
      ]
    },
    {
      id: "CNT-2026-074",
      code: "INM-MSFT-2026-02",
      name: "Microsoft Azure ExpressRoute & M365 E5 Enterprise License",
      vendor: "Microsoft Corporation (Azure & M365)",
      category: "Purchase",
      type: "Enterprise Software License",
      branch: "Innomick Kuwait Tech Hub",
      department: "Information Technology",
      value: 185000,
      currency: "USD",
      startDate: "15 Nov 2026",
      endDate: "14 Nov 2027",
      status: "Expiring Soon",
      owner: "Imran Hussain",
      description: "Annual M365 E5 enterprise licensing bundle with Defender for Cloud security features.",
      versions: [
        { no: "2.0", date: "08 Oct 2026", user: "Kevin Brooks", comment: "Renewal quote received" }
      ]
    },
    {
      id: "CNT-2026-055",
      code: "INM-ORA-2025-08",
      name: "Oracle Autonomous Database Cloud Platform Support",
      vendor: "Oracle Cloud Infrastructure (OCI)",
      category: "Service",
      type: "Vendor Statement of Work (SOW)",
      branch: "Innomick Riyadh Regional Office (KSA)",
      department: "Facilities Management",
      value: 310000,
      currency: "USD",
      startDate: "01 Jan 2026",
      endDate: "31 Dec 2026",
      status: "Active",
      owner: "Leo Fernandes",
      description: "Database operational maintenance and level-3 DBA support.",
      versions: [
        { no: "1.0", date: "02 Jan 2026", user: "Leo Fernandes", comment: "Executed contract" }
      ]
    },
    {
      id: "CNT-2026-112",
      code: "INM-DDOG-2026-11",
      name: "Datadog Cloud Observability & APM Platform Subscription",
      vendor: "Datadog Cloud Monitoring",
      category: "Purchase",
      type: "SaaS Subscription Agreement",
      branch: "Innomick Dubai HQ (UAE)",
      department: "Information Technology",
      value: 64000,
      currency: "USD",
      startDate: "01 Dec 2026",
      endDate: "30 Nov 2027",
      status: "Pending Signature",
      owner: "Imran Hussain",
      description: "APM tracing, log management, and synthetics for Innomick microservices.",
      versions: [
        { no: "1.0", date: "10 Oct 2026", user: "Imran Hussain", comment: "Draft sent for signature" }
      ]
    },
    {
      id: "CNT-2026-031",
      code: "INM-CSCO-2025-01",
      name: "Cisco Catalyst Core Switches Maintenance & SmartNet Support",
      vendor: "Cisco Systems International",
      category: "Purchase",
      type: "Hardware Maintenance & Support",
      branch: "Innomick Kuwait Tech Hub",
      department: "Facilities Management",
      value: 95000,
      currency: "USD",
      startDate: "01 Feb 2026",
      endDate: "31 Jan 2027",
      status: "Expiring Soon",
      owner: "Priya Nair",
      description: "Hardware replacement SLA within 4 hours for Kuwait data centers.",
      versions: [
        { no: "1.0", date: "20 Jan 2026", user: "Priya Nair", comment: "Active warranty" }
      ]
    },
    {
      id: "CNT-2026-140",
      code: "INM-PAN-2026-05",
      name: "Palo Alto Networks Next-Gen Firewall Cluster Subscriptions",
      vendor: "Palo Alto Networks",
      category: "Service",
      type: "Vendor Statement of Work (SOW)",
      branch: "Innomick Dubai HQ (UAE)",
      department: "Facilities Management",
      value: 145000,
      currency: "USD",
      startDate: "01 Oct 2026",
      endDate: "30 Sep 2028",
      status: "Active",
      owner: "Sara Thomas",
      description: "Threat prevention, wildfire, and global protect subscription package.",
      versions: [
        { no: "1.1", date: "28 Sep 2026", user: "Sara Thomas", comment: "Final sign-off" }
      ]
    },
    {
      id: "CNT-2026-155",
      code: "INM-SNOW-2026-09",
      name: "Snowflake Enterprise Data Warehouse Capacity Agreement",
      vendor: "Snowflake Data Cloud",
      category: "Service",
      type: "SaaS Subscription Agreement",
      branch: "Innomick Singapore APAC Center",
      department: "Information Technology",
      value: 280000,
      currency: "USD",
      startDate: "15 Oct 2026",
      endDate: "14 Oct 2027",
      status: "Active",
      owner: "Imran Hussain",
      description: "Multi-cluster enterprise warehouse credits for AI and predictive analytics.",
      versions: [
        { no: "1.0", date: "14 Oct 2026", user: "Imran Hussain", comment: "Executed contract" }
      ]
    }
  ],

  // 4. Contract Requests (Matching Screenshot 01: 21 records)
  requests: [
    {
      id: "REQ-01",
      refNo: "INM/ITD/SVC/2634/2026",
      hasIcon: false,
      contractName: "Help Desk Outsourcing",
      requestType: "New",
      status: "In Approval",
      vendorName: "BrightPath IT Services",
      department: "Information Technology",
      durationMonths: "0 Month",
      durationDates: "16 Oct 26 - 31 Oct 26",
      durationProgress: 85,
      isPendingActivation: false,
      contractValue: "12,345",
      category: "Service",
      branch: "Innomick",
      submittedBy: "Sara Thomas"
    },
    {
      id: "REQ-02",
      refNo: "INM/ITD/SVC/2574/2026",
      hasIcon: false,
      contractName: "",
      requestType: "New",
      status: "Draft",
      vendorName: "",
      department: "Information Technology",
      durationMonths: "",
      durationDates: "",
      durationProgress: 0,
      isPendingActivation: true,
      contractValue: "",
      category: "Service",
      branch: "Innomick",
      submittedBy: "Sara Thomas"
    },
    {
      id: "REQ-03",
      refNo: "CON-DEMO-12222",
      hasIcon: true,
      contractName: "IT Support Services Agreement",
      requestType: "New",
      status: "Draft",
      vendorName: "Alpha Tech",
      department: "Information Technology",
      durationMonths: "11 Months",
      durationDates: "01 Jan 24 - 31 Dec 24",
      durationProgress: 75,
      isPendingActivation: false,
      contractValue: "25,000",
      category: "Service",
      branch: "Innomick",
      submittedBy: "Sara Thomas"
    },
    {
      id: "REQ-04",
      refNo: "CON-DEMO-1456",
      hasIcon: true,
      contractName: "IT Support Services Agreement",
      requestType: "Renewal",
      status: "Draft",
      vendorName: "Alpha Tech",
      department: "Information Technology",
      durationMonths: "11 Months",
      durationDates: "01 Jan 25 - 31 Dec 25",
      durationProgress: 60,
      isPendingActivation: false,
      contractValue: "30,000",
      category: "Service",
      branch: "Innomick",
      submittedBy: "Sara Thomas"
    },
    {
      id: "REQ-05",
      refNo: "INM/12345/2023",
      hasIcon: true,
      contractName: "Alpha Gen",
      requestType: "Renewal",
      status: "Draft",
      vendorName: "Delta Engineering",
      department: "Information Technology",
      durationMonths: "1 Month",
      durationDates: "01 Nov 28 - 07 Dec 28",
      durationProgress: 40,
      isPendingActivation: false,
      contractValue: "2,000",
      category: "Service",
      branch: "Innomick",
      submittedBy: "Sara Thomas"
    },
    {
      id: "REQ-06",
      refNo: "INM/ITD/SVC/2626/2026",
      hasIcon: false,
      contractName: "New Contract",
      requestType: "New",
      status: "Draft",
      vendorName: "Orbit Networks",
      department: "Information Technology",
      durationMonths: "2 Years",
      durationDates: "08 Oct 26 - 31 Oct 28",
      durationProgress: 50,
      isPendingActivation: false,
      contractValue: "50,000",
      category: "Service",
      branch: "Innomick",
      submittedBy: "Sara Thomas"
    },
    {
      id: "REQ-07",
      refNo: "ZFS/12478569",
      hasIcon: false,
      contractName: "Zenith Facility Services",
      requestType: "New",
      status: "Draft",
      vendorName: "Zenith Facility Services",
      department: "Information Technology",
      durationMonths: "0 Month",
      durationDates: "01 Oct 26 - 28 Oct 26",
      durationProgress: 35,
      isPendingActivation: false,
      contractValue: "12,478,569",
      category: "Service",
      branch: "Innomick",
      submittedBy: "Sara Thomas"
    },
    {
      id: "REQ-08",
      refNo: "INM/ITD/SVC/2598/2026",
      hasIcon: false,
      contractName: "Printer Fleet Management",
      requestType: "Amend",
      status: "In Approval",
      vendorName: "Gulf Office Supplies",
      department: "Information Technology",
      durationMonths: "6 Months",
      durationDates: "15 Sep 26 - 15 Mar 27",
      durationProgress: 45,
      isPendingActivation: false,
      contractValue: "4,500",
      category: "Service",
      branch: "Innomick",
      submittedBy: "Sara Thomas"
    },
    {
      id: "REQ-09",
      refNo: "INM/ITD/SVC/2586/2026",
      hasIcon: false,
      contractName: "Courier Services",
      requestType: "New",
      status: "In Approval",
      vendorName: "Innomick",
      department: "Information Technology",
      durationMonths: "1 Year",
      durationDates: "01 Oct 26 - 30 Sep 27",
      durationProgress: 30,
      isPendingActivation: false,
      contractValue: "451",
      category: "Service",
      branch: "Innomick",
      submittedBy: "Sara Thomas"
    },
    {
      id: "REQ-10",
      refNo: "INM/ITD/SVC/2519/2026",
      hasIcon: false,
      contractName: "Crescent Software",
      requestType: "New",
      status: "In Approval",
      vendorName: "Crescent Software",
      department: "Information Technology",
      durationMonths: "3 Years",
      durationDates: "01 Aug 26 - 31 Jul 29",
      durationProgress: 20,
      isPendingActivation: false,
      contractValue: "7,889,562",
      category: "Service",
      branch: "Innomick",
      submittedBy: "Sara Thomas"
    },
    {
      id: "REQ-11",
      refNo: "INM/MID/SVC/001/2026",
      hasIcon: false,
      contractName: "Security Guard Services",
      requestType: "New",
      status: "In Approval",
      vendorName: "Innomick",
      department: "Information Technology",
      durationMonths: "1 Year",
      durationDates: "01 Jul 26 - 30 Jun 27",
      durationProgress: 55,
      isPendingActivation: false,
      contractValue: "1,000",
      category: "Service",
      branch: "Innomick",
      submittedBy: "Sara Thomas"
    },
    {
      id: "REQ-12",
      refNo: "INM/CUS/SVC/2431/2026",
      hasIcon: false,
      contractName: "Vertex Supplies",
      requestType: "New",
      status: "In Approval",
      vendorName: "Vertex Supplies",
      department: "Information Technology",
      durationMonths: "6 Months",
      durationDates: "01 Jun 26 - 30 Nov 26",
      durationProgress: 70,
      isPendingActivation: false,
      contractValue: "789",
      category: "Service",
      branch: "Innomick",
      submittedBy: "Sara Thomas"
    },
    {
      id: "REQ-13",
      refNo: "INM/ITD/SVC/2360/2026",
      hasIcon: false,
      contractName: "Secure Mail Gateway",
      requestType: "New",
      status: "In Approval",
      vendorName: "Secure Mail Gateway",
      department: "Information Technology",
      durationMonths: "1 Year",
      durationDates: "15 May 26 - 14 May 27",
      durationProgress: 65,
      isPendingActivation: false,
      contractValue: "789",
      category: "Service",
      branch: "Innomick",
      submittedBy: "Sara Thomas"
    },
    {
      id: "REQ-14",
      refNo: "INM/MID/SVC/2354/2026",
      hasIcon: false,
      contractName: "Vendor Portal Subscription",
      requestType: "New",
      status: "In Approval",
      vendorName: "Innomick",
      department: "Information Technology",
      durationMonths: "1 Year",
      durationDates: "01 May 26 - 30 Apr 27",
      durationProgress: 80,
      isPendingActivation: false,
      contractValue: "1,000",
      category: "Service",
      branch: "Innomick",
      submittedBy: "Sara Thomas"
    },
    {
      id: "REQ-15",
      refNo: "INM/ITD/SVC/2350/2026",
      hasIcon: false,
      contractName: "Firewall Renewal SLA",
      requestType: "Renewal",
      status: "In Approval",
      vendorName: "Alpha Tech",
      department: "Information Technology",
      durationMonths: "2 Years",
      durationDates: "01 Apr 26 - 31 Mar 28",
      durationProgress: 50,
      isPendingActivation: false,
      contractValue: "45,000",
      category: "Service",
      branch: "Innomick",
      submittedBy: "Sara Thomas"
    },
    {
      id: "REQ-16",
      refNo: "INM/ITD/SVC/2345/2026",
      hasIcon: false,
      contractName: "Datacenter Hosting SOW",
      requestType: "New",
      status: "In Approval",
      vendorName: "Metro Cleaning Solutions",
      department: "Information Technology",
      durationMonths: "1 Year",
      durationDates: "15 Mar 26 - 14 Mar 27",
      durationProgress: 60,
      isPendingActivation: false,
      contractValue: "8,060,000",
      category: "Service",
      branch: "Innomick",
      submittedBy: "Sara Thomas"
    },
    {
      id: "REQ-17",
      refNo: "INM/ITD/SVC/2320/2026",
      hasIcon: false,
      contractName: "Network Optimization Service",
      requestType: "Extension",
      status: "In Approval",
      vendorName: "Unknown Vendor",
      department: "Information Technology",
      durationMonths: "6 Months",
      durationDates: "01 Mar 26 - 31 Aug 26",
      durationProgress: 90,
      isPendingActivation: false,
      contractValue: "1,200,000",
      category: "Service",
      branch: "Innomick",
      submittedBy: "Sara Thomas"
    },
    {
      id: "REQ-18",
      refNo: "INM/ITD/SVC/2310/2026",
      hasIcon: false,
      contractName: "Disaster Recovery Testing",
      requestType: "New",
      status: "Draft",
      vendorName: "Unknown Vendor",
      department: "Information Technology",
      durationMonths: "1 Year",
      durationDates: "01 Feb 26 - 31 Jan 27",
      durationProgress: 40,
      isPendingActivation: false,
      contractValue: "2,500,000",
      category: "Service",
      branch: "Innomick",
      submittedBy: "Sara Thomas"
    },
    {
      id: "REQ-19",
      refNo: "INM/ITD/SVC/2290/2026",
      hasIcon: false,
      contractName: "Endpoint Security Licenses",
      requestType: "Renewal",
      status: "Draft",
      vendorName: "Alpha Tech",
      department: "Information Technology",
      durationMonths: "1 Year",
      durationDates: "15 Jan 26 - 14 Jan 27",
      durationProgress: 45,
      isPendingActivation: false,
      contractValue: "18,000",
      category: "Service",
      branch: "Innomick",
      submittedBy: "Sara Thomas"
    },
    {
      id: "REQ-20",
      refNo: "INM/ITD/SVC/2280/2026",
      hasIcon: false,
      contractName: "Annual Storage Maintenance",
      requestType: "Extension",
      status: "Draft",
      vendorName: "Alpha Tech",
      department: "Information Technology",
      durationMonths: "2 Years",
      durationDates: "01 Jan 26 - 31 Dec 27",
      durationProgress: 35,
      isPendingActivation: false,
      contractValue: "27,000",
      category: "Service",
      branch: "Innomick",
      submittedBy: "Sara Thomas"
    },
    {
      id: "REQ-21",
      refNo: "INM/ITD/SVC/2250/2026",
      hasIcon: false,
      contractName: "Core Network Switch Support",
      requestType: "New",
      status: "Draft",
      vendorName: "Unknown Vendor",
      department: "Information Technology",
      durationMonths: "1 Year",
      durationDates: "01 Jan 26 - 31 Dec 26",
      durationProgress: 25,
      isPendingActivation: false,
      contractValue: "1,500,000",
      category: "Service",
      branch: "Innomick",
      submittedBy: "Sara Thomas"
    }
  ],

  // 5. Contract Templates (matching screenshot 07)
  templates: [
    {
      id: "TPL-01",
      name: "Master Services Agreement (MSA)",
      type: "Master Services Agreement",
      category: "Corporate Legal",
      updated: "10 Oct 2026",
      author: "Legal Team"
    },
    {
      id: "TPL-02",
      name: "Cloud Infrastructure Provider SLA",
      type: "Cloud Infrastructure",
      category: "Engineering",
      updated: "05 Oct 2026",
      author: "Imran Hussain"
    },
    {
      id: "TPL-03",
      name: "Enterprise Software License & Maintenance",
      type: "Software Licensing",
      category: "Procurement",
      updated: "28 Sep 2026",
      author: "Finance Team"
    },
    {
      id: "TPL-04",
      name: "Vendor Statement of Work (SOW)",
      type: "Vendor SOW",
      category: "Delivery",
      updated: "02 Oct 2026",
      author: "Kevin Brooks"
    },
    {
      id: "TPL-05",
      name: "SaaS Subscription Terms & Privacy Addendum",
      type: "SaaS Agreement",
      category: "Legal & Security",
      updated: "22 Sep 2026",
      author: "Legal Team"
    },
    {
      id: "TPL-06",
      name: "Non-Disclosure Agreement (Mutual NDA)",
      type: "NDA Agreement",
      category: "General Corporate",
      updated: "15 Aug 2026",
      author: "Legal Team"
    },
    {
      id: "TPL-07",
      name: "Subcontractor Consulting Services Agreement",
      type: "Professional Consulting",
      category: "HR & Delivery",
      updated: "11 Sep 2026",
      author: "HR Team"
    },
    {
      id: "TPL-08",
      name: "Data Processing Agreement (GDPR & SOC2)",
      type: "Compliance Addendum",
      category: "Cybersecurity",
      updated: "08 Oct 2026",
      author: "Security Team"
    },
    {
      id: "TPL-09",
      name: "Hardware Equipment Lease & SmartNet SLA",
      type: "Hardware Maintenance",
      category: "Procurement",
      updated: "18 Sep 2026",
      author: "Infrastructure Team"
    },
    {
      id: "TPL-10",
      name: "Staff Augmentation & Consulting SOW",
      type: "Professional Consulting",
      category: "Talent Delivery",
      updated: "14 Oct 2026",
      author: "Delivery Head"
    },
    {
      id: "TPL-11",
      name: "Multi-Cloud Security Architecture SLA",
      type: "Cloud Security",
      category: "Cybersecurity",
      updated: "12 Oct 2026",
      author: "CISO Office"
    },
    {
      id: "TPL-12",
      name: "Fixed-Price Milestone Delivery Agreement",
      type: "Milestone Agreement",
      category: "Commercial Contracts",
      updated: "09 Oct 2026",
      author: "Legal Team"
    },
    // Real SharePoint Templates (Arjun Mehta view)
    { id: "TPL-SP-01", name: "Bilingual Service Agreement", type: "Standard", category: "General", updated: "20 Oct 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-02", name: "Standard Service Contract", type: "Standard", category: "Comprehensive", updated: "18 Oct 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-03", name: "Arabic Service Contract", type: "Standard", category: "Localization", updated: "15 Oct 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-04", name: "Purchase Order Agreement", type: "Standard", category: "Testing", updated: "14 Oct 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-05", name: "Maintenance Agreement", type: "Standard", category: "Forms", updated: "12 Oct 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-06", name: "Annual Maintenance Contract", type: "Standard", category: "Forms", updated: "10 Oct 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-07", name: "Equipment Supply Agreement", type: "Standard", category: "Forms", updated: "08 Oct 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-08", name: "Construction Works Contract", type: "Standard", category: "Corporate", updated: "06 Oct 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-09", name: "Construction Variation Order", type: "Standard", category: "Corporate", updated: "04 Oct 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-10", name: "Consultancy Agreement", type: "Standard", category: "Corporate", updated: "02 Oct 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-11", name: "Software Development Agreement", type: "Standard", category: "Demo", updated: "30 Sep 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-12", name: "Facility Management Contract", type: "Standard", category: "Forms", updated: "28 Sep 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-13", name: "Catering Services Agreement", type: "Standard", category: "Forms", updated: "25 Sep 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-14", name: "Cleaning Services Contract", type: "Standard", category: "Testing", updated: "22 Sep 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-15", name: "Security Services Contract", type: "Standard", category: "Testing", updated: "20 Sep 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-16", name: "Transport Services Agreement", type: "Standard", category: "Forms", updated: "18 Sep 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-17", name: "Lease Agreement", type: "Standard", category: "Testing", updated: "15 Sep 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-18", name: "Innomick Master Template", type: "Standard", category: "Branding", updated: "12 Sep 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-19", name: "Innomick Service Template", type: "Standard", category: "Innomick Templates", updated: "10 Sep 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-20", name: "Innomick Purchase Template", type: "Standard", category: "Innomick Templates", updated: "08 Sep 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-21", name: "Innomick Construction Template", type: "Standard", category: "Innomick Templates", updated: "06 Sep 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-22", name: "Innomick Renewal Template", type: "Standard", category: "Innomick Templates", updated: "04 Sep 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-23", name: "Innomick Amendment Template", type: "Standard", category: "Innomick Templates", updated: "02 Sep 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-24", name: "Innomick Extension Template", type: "Standard", category: "Innomick Templates", updated: "01 Sep 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-25", name: "Innomick SLA Template", type: "Standard", category: "Innomick Templates", updated: "28 Aug 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-26", name: "Innomick NDA Template", type: "Standard", category: "Innomick Templates", updated: "25 Aug 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-27", name: "Innomick Licensing Template", type: "Standard", category: "Innomick Templates", updated: "20 Aug 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-28", name: "Innomick Service", type: "Standard", category: "Innomick Templates", updated: "15 Aug 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-29", name: "Innomick Support Template", type: "Standard", category: "Innomick Templates", updated: "12 Aug 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-30", name: "Innomick Consulting Template", type: "Standard", category: "Innomick Templates", updated: "10 Aug 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-31", name: "Innomick Supply Template", type: "Standard", category: "Innomick Templates", updated: "08 Aug 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-32", name: "Innomick Template", type: "Standard", category: "Innomick Templates", updated: "05 Aug 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-33", name: "Innomick Works Template", type: "Standard", category: "Innomick Templates", updated: "01 Aug 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-34", name: "Civil Works Contract", type: "Standard", category: "Legal & Delivery", updated: "25 Jul 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-35", name: "Medical Supplies Agreement", type: "Standard", category: "QA Testing", updated: "20 Jul 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-36", name: "Purchase Contract", type: "Standard", category: "Procurement", updated: "18 Jul 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-37", name: "Vendor Framework Agreement", type: "Standard", category: "QA Testing", updated: "15 Jul 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-38", name: "Laboratory Services Agreement", type: "Standard", category: "QA Testing", updated: "12 Jul 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-39", name: "IT Hardware Supply Agreement", type: "Standard", category: "QA Testing", updated: "10 Jul 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-40", name: "Telecom Services Agreement", type: "Standard", category: "QA Testing", updated: "05 Jul 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-41", name: "General Services Template", type: "Standard", category: "General", updated: "01 Jul 2026", author: "Arjun Mehta" },
    { id: "TPL-SP-42", name: "Multi Page Template", type: "Standard", category: "General", updated: "25 Jun 2026", author: "Arjun Mehta" }
  ],

  // 6. Approvals Inbox & Outbox
  approvals: {
    inbox: [
      {
        id: "APP-F01",
        name: "INM/MID/SVC/1750/2025",
        title: "INM/MID/SVC/1750/2025",
        approvalType: "Sequential",
        status: "Step 1",
        approvedCount: 0,
        totalCount: 2,
        progressPercent: 0,
        requestedBy: "Arjun Mehta",
        requestedOn: "2026-09-22"
      },
      {
        id: "APP-F02",
        name: "INM-MID-SVC-2533-2026 Request Letter 1786103907547.docx",
        title: "INM-MID-SVC-2533-2026 Request Letter 1786103907547.docx",
        approvalType: "Sequential",
        status: "Step 1",
        approvedCount: 0,
        totalCount: 1,
        progressPercent: 0,
        requestedBy: "Arjun Mehta",
        requestedOn: "2026-08-07"
      },
      {
        id: "APP-F03",
        name: "INM-MID-SVC-2513-2026 Draft 1784653607775.docx",
        title: "INM-MID-SVC-2513-2026 Draft 1784653607775.docx",
        approvalType: "Parallel",
        status: "2 Approvals Pending",
        approvedCount: 1,
        totalCount: 3,
        progressPercent: 33,
        requestedBy: "Arjun Mehta",
        requestedOn: "2026-07-21"
      },
      {
        id: "APP-F04",
        name: "INM-MID-SVC-2513-2026 Request Letter 1784653601218.docx",
        title: "INM-MID-SVC-2513-2026 Request Letter 1784653601218.docx",
        approvalType: "Sequential",
        status: "Team Lead",
        approvedCount: 0,
        totalCount: 4,
        progressPercent: 0,
        requestedBy: "Arjun Mehta",
        requestedOn: "2026-07-21"
      },
      {
        id: "APP-F05",
        name: "INM-MID-SVC-2508-2026 Renewal Request Letter 1784652821390.docx",
        title: "INM-MID-SVC-2508-2026 Renewal Request Letter 1784652821390.docx",
        approvalType: "Sequential",
        status: "Team Lead",
        approvedCount: 0,
        totalCount: 4,
        progressPercent: 0,
        requestedBy: "Arjun Mehta",
        requestedOn: "2026-07-21"
      },
      {
        id: "APP-F06",
        name: "INM-MID-SVC-001-2026 Draft 1784648585198.docx",
        title: "INM-MID-SVC-001-2026 Draft 1784648585198.docx",
        approvalType: "Parallel",
        status: "3 Approvals Pending",
        approvedCount: 0,
        totalCount: 3,
        progressPercent: 0,
        requestedBy: "Arjun Mehta",
        requestedOn: "2026-07-21"
      },
      {
        id: "APP-F07",
        name: "INM-MID-SVC-2508-2026 Draft 1784649923280.docx",
        title: "INM-MID-SVC-2508-2026 Draft 1784649923280.docx",
        approvalType: "Parallel",
        status: "2 Approvals Pending",
        approvedCount: 1,
        totalCount: 3,
        progressPercent: 33,
        requestedBy: "Arjun Mehta",
        requestedOn: "2026-07-21"
      },
      {
        id: "APP-F08",
        name: "INM/ITD/SVC/2399/2026",
        title: "INM/ITD/SVC/2399/2026",
        approvalType: "Sequential",
        status: "Step 1",
        approvedCount: 0,
        totalCount: 1,
        progressPercent: 0,
        requestedBy: "Arjun Mehta",
        requestedOn: "2026-07-17"
      },
      {
        id: "APP-F09",
        name: "Innomick Services/751771",
        title: "Innomick Services/751771",
        approvalType: "Sequential",
        status: "Step 1",
        approvedCount: 0,
        totalCount: 1,
        progressPercent: 0,
        requestedBy: "Arjun Mehta",
        requestedOn: "2026-07-16"
      },
      {
        id: "APP-F10",
        name: "INM/FMD/SVC/2410/2026",
        title: "INM/FMD/SVC/2410/2026",
        approvalType: "Sequential",
        status: "Step 1",
        approvedCount: 0,
        totalCount: 1,
        progressPercent: 0,
        requestedBy: "Arjun Mehta",
        requestedOn: "2026-07-16"
      },
      {
        id: "APP-01",
        contractCode: "CNT-2026-089",
        name: "AWS Enterprise Cloud Compute Reserve 2026-2029",
        title: "AWS Enterprise Cloud Compute Reserve 2026-2029",
        approvalType: "Sequential",
        status: "Technical Lead Approval",
        approvedCount: 1,
        totalCount: 2,
        progressPercent: 50,
        vendor: "Amazon Web Services (AWS Enterprise)",
        submittedBy: "Rohan Kapoor (FinOps Lead)",
        requestedBy: "Rohan Kapoor",
        amount: "$420,000",
        date: "12 Oct 2026",
        requestedOn: "2026-10-12",
        stage: "Technical Lead Approval",
        urgency: "High"
      },
      {
        id: "APP-02",
        contractCode: "CNT-2026-074",
        name: "Microsoft Azure ExpressRoute Gateway & SLA Renewal",
        title: "Microsoft Azure ExpressRoute Gateway & SLA Renewal",
        approvalType: "Parallel",
        status: "Cloud Governance Review",
        approvedCount: 2,
        totalCount: 3,
        progressPercent: 66,
        vendor: "Microsoft Corporation (Azure & M365)",
        submittedBy: "Kevin Brooks",
        requestedBy: "Kevin Brooks",
        amount: "$185,000",
        date: "10 Oct 2026",
        requestedOn: "2026-10-10",
        stage: "Cloud Governance Review",
        urgency: "Urgent"
      },
      {
        id: "APP-03",
        contractCode: "CNT-2026-112",
        name: "Datadog Cloud Observability & APM Platform Subscription",
        title: "Datadog Cloud Observability & APM Platform Subscription",
        approvalType: "Sequential",
        status: "Budgetary Sign-off",
        approvedCount: 0,
        totalCount: 2,
        progressPercent: 0,
        vendor: "Datadog Cloud Monitoring",
        submittedBy: "DevOps Architecture Guild",
        requestedBy: "DevOps Architecture Guild",
        amount: "$64,000",
        date: "09 Oct 2026",
        requestedOn: "2026-10-09",
        stage: "Budgetary Sign-off",
        urgency: "Medium"
      }
    ],
    outbox: [
      {
        id: "OUT-01",
        contractCode: "CNT-2026-155",
        title: "Snowflake Enterprise Data Warehouse Capacity Agreement",
        vendor: "Snowflake Data Cloud",
        approver: "VP of Engineering & CTO",
        amount: "$280,000",
        submittedDate: "14 Oct 2026",
        status: "Pending VP Signature"
      }
    ],
    history: [
      {
        id: "HIST-01",
        contractCode: "CNT-2026-140",
        title: "Palo Alto Networks Next-Gen Firewall Cluster Subscriptions",
        vendor: "Palo Alto Networks",
        action: "Approved",
        actor: "Imran Hussain",
        date: "28 Sep 2026",
        notes: "Approved based on SOC2 compliance requirement."
      },
      {
        id: "HIST-02",
        contractCode: "CNT-2026-055",
        title: "Oracle Autonomous Database Cloud Platform Support",
        vendor: "Oracle Cloud Infrastructure (OCI)",
        action: "Approved",
        actor: "Imran Hussain",
        date: "15 Jan 2026",
        notes: "Budget verified with finance head."
      }
    ]
  },

  // 7. Notifications (Includes real SharePoint #STEP notifications for the signed-in user)
  notifications: [
    {
      id: "NOTIF-SP-3373",
      stepCode: "#STEP3373",
      title: "#STEP3373",
      message: "#STEP3373 A contract request document has been submitted for your approval",
      time: "Just now",
      unread: true,
      category: "Approval Request",
      actionText: "Take Action"
    },
    {
      id: "NOTIF-SP-3344",
      stepCode: "#STEP3344",
      title: "#STEP3344",
      message: "#STEP3344 A contract request document has been submitted for your approval",
      time: "10 mins ago",
      unread: true,
      category: "Approval Request",
      actionText: "Take Action"
    },
    {
      id: "NOTIF-SP-3569",
      stepCode: "#STEP3569",
      title: "#STEP3569",
      message: "#STEP3569 A contract request document has been submitted for your approval",
      time: "1 hour ago",
      unread: true,
      category: "Approval Request",
      actionText: "Take Action"
    },
    {
      id: "NOTIF-SP-3484",
      stepCode: "#STEP3484",
      title: "#STEP3484",
      message: "#STEP3484 A contract request document has been submitted for your approval",
      time: "2 hours ago",
      unread: true,
      category: "Approval Request",
      actionText: "Take Action"
    },
    {
      id: "NOTIF-SP-3513",
      stepCode: "#STEP3513",
      title: "#STEP3513",
      message: "#STEP3513 A contract request document has been submitted for your approval",
      time: "3 hours ago",
      unread: true,
      category: "Approval Request",
      actionText: "Take Action"
    },
    {
      id: "NOTIF-SP-3514",
      stepCode: "#STEP3514",
      title: "#STEP3514",
      message: "#STEP3514 A contract request document has been submitted for your approval",
      time: "4 hours ago",
      unread: true,
      category: "Approval Request",
      actionText: "Take Action"
    },
    {
      id: "NOTIF-SP-3530",
      stepCode: "#STEP3530",
      title: "#STEP3530",
      message: "#STEP3530 A contract request document has been submitted for your approval",
      time: "5 hours ago",
      unread: true,
      category: "Approval Request",
      actionText: "Take Action"
    },
    {
      id: "NOTIF-SP-3576",
      stepCode: "#STEP3576",
      title: "#STEP3576",
      message: "#STEP3576 A contract request document has been submitted for your approval",
      time: "6 hours ago",
      unread: true,
      category: "Approval Request",
      actionText: "Take Action"
    },
    {
      id: "NOTIF-SP-3588",
      stepCode: "#STEP3588",
      title: "#STEP3588",
      message: "#STEP3588 A contract request document has been submitted for your approval",
      time: "Yesterday",
      unread: true,
      category: "Approval Request",
      actionText: "Take Action"
    },
    {
      id: "NOTIF-1",
      stepCode: "ALERT",
      title: "Contract Renewal Alert: Microsoft Azure SLA",
      message: "The Microsoft Azure ExpressRoute agreement (CNT-2026-074) expires in 29 days. Renewal review is pending.",
      time: "2 hours ago",
      unread: true,
      category: "Expiring",
      actionText: "Review Contract"
    },
    {
      id: "NOTIF-2",
      stepCode: "ASSIGN",
      title: "Approval Assigned: AWS Enterprise Compute",
      message: "You have been assigned as the primary technical signatory for AWS Enterprise Compute (CNT-2026-089).",
      time: "5 hours ago",
      unread: true,
      category: "Approval",
      actionText: "View Request"
    },
    {
      id: "NOTIF-3",
      stepCode: "SUCCESS",
      title: "Contract Executed: Palo Alto Firewall",
      message: "Contract CNT-2026-140 has been fully executed and registered into the active repository.",
      time: "Yesterday at 16:30",
      unread: false,
      category: "Execution",
      actionText: "View Details"
    }
  ],

  // User Profiles (Allowing seamless switching between demo users)
  userProfiles: {
    arjun: {
      key: "arjun",
      name: "Arjun Mehta",
      initials: "MA",
      title: "Medical & Corporate Approver",
      email: "arjun.mehta@innomicktechnologies.com",
      badgeCount: 88,
      stats: {
        pendingApprovals: 88,
        expiringSoon: 0,
        stuckApprovals: 88,
        draftsAging: 18,
        pendingExecution: 0,
        noticePeriod: 0
      }
    },
    sara: {
      key: "sara",
      name: "Sara Thomas",
      initials: "MW",
      title: "Enterprise IT Contract Head",
      email: "sara.thomas@innomicktechnologies.com",
      badgeCount: 115,
      stats: {
        pendingApprovals: 115,
        expiringSoon: 0,
        stuckApprovals: 112,
        draftsAging: 13,
        pendingExecution: 0,
        noticePeriod: 0
      }
    },
    imran: {
      key: "imran",
      name: "Imran Hussain",
      initials: "IH",
      title: "Lead Cloud Solutions Consultant",
      email: "imran.h@innomicktechnologies.com",
      badgeCount: 42,
      stats: {
        pendingApprovals: 42,
        expiringSoon: 2,
        stuckApprovals: 18,
        draftsAging: 7,
        pendingExecution: 3,
        noticePeriod: 1
      }
    }
  },

  activeProfileKey: "arjun",

  // 8. Imported Contracts History
  importedContracts: [
    {
      id: "IMP-101",
      fileName: "Legacy_EMC_Storage_Array_Support_2024.xlsx",
      recordsCount: 14,
      importedDate: "05 Oct 2026",
      importedBy: "Imran Hussain",
      status: "Successfully Ingested"
    },
    {
      id: "IMP-102",
      fileName: "Q3_Cisco_Global_SmartNet_Assets.csv",
      recordsCount: 28,
      importedDate: "20 Sep 2026",
      importedBy: "Priya Nair",
      status: "Successfully Ingested"
    }
  ],

  // 9. Contract Value Intelligence Data (Matching Screenshots 01-04)
  contractValueVendors: [
    "All Vendors",
    "Zenith Facility Services",
    "Alpha Tech",
    "Metro Cleaning Solutions",
    "Innomick Solutions",
    "Unknown Vendor",
    "Delta Engineering",
    "Orbit Networks"
  ],

  contractValueData: {
    "All Vendors": {
      totalValue: "13.46M",
      totalContracts: 13,
      avgPerContract: "1.04M",
      uniqueVendors: 7,
      scaleTicks: ["0", "5M", "10M", "15M", "20M"],
      barWidthPercent: 67.3,
      vendors: [
        { name: "Alpha Tech", contracts: 5, percent: "38.5%", barColor: "#f59e0b" },
        { name: "Unknown Vendor", contracts: 3, percent: "23.1%", barColor: "#008272" },
        { name: "Zenith Facility Services", contracts: 1, percent: "7.7%", barColor: "#008272" },
        { name: "Delta Engineering", contracts: 1, percent: "7.7%", barColor: "#008272" },
        { name: "Orbit Networks", contracts: 1, percent: "7.7%", barColor: "#008272" },
        { name: "Innomick Solutions", contracts: 1, percent: "7.7%", barColor: "#008272" },
        { name: "Metro Cleaning Solutions", contracts: 1, percent: "7.7%", barColor: "#008272" }
      ]
    },
    "Alpha Tech": {
      totalValue: "145K",
      totalContracts: 5,
      avgPerContract: "29K",
      uniqueVendors: 1,
      scaleTicks: ["0", "50K", "100K", "150K", "200K"],
      barWidthPercent: 72.5,
      vendors: [
        { name: "Alpha Tech", contracts: 5, percent: "100%", barColor: "#f59e0b" }
      ]
    },
    "Unknown Vendor": {
      totalValue: "5.20M",
      totalContracts: 3,
      avgPerContract: "1.73M",
      uniqueVendors: 1,
      scaleTicks: ["0", "2M", "4M", "6M", "8M"],
      barWidthPercent: 65,
      vendors: [
        { name: "Unknown Vendor", contracts: 3, percent: "100%", barColor: "#008272" }
      ]
    },
    "Zenith Facility Services": {
      totalValue: "4.5K",
      totalContracts: 1,
      avgPerContract: "4.5K",
      uniqueVendors: 1,
      scaleTicks: ["0", "2.5K", "5K", "7.5K", "10K"],
      barWidthPercent: 45,
      vendors: [
        { name: "Zenith Facility Services", contracts: 1, percent: "100%", barColor: "#008272" }
      ]
    },
    "Metro Cleaning Solutions": {
      totalValue: "8.06M",
      totalContracts: 1,
      avgPerContract: "8.06M",
      uniqueVendors: 1,
      scaleTicks: ["0", "2.5M", "5M", "7.5M", "10M"],
      barWidthPercent: 80.6,
      vendors: [
        { name: "Metro Cleaning Solutions", contracts: 1, percent: "100%", barColor: "#008272" }
      ]
    },
    "Innomick Solutions": {
      totalValue: "1.0K",
      totalContracts: 1,
      avgPerContract: "1.0K",
      uniqueVendors: 1,
      scaleTicks: ["0", "1K", "2K", "3K", "5K"],
      barWidthPercent: 20,
      vendors: [
        { name: "Innomick Solutions", contracts: 1, percent: "100%", barColor: "#008272" }
      ]
    },
    "Delta Engineering": {
      totalValue: "2.0K",
      totalContracts: 1,
      avgPerContract: "2.0K",
      uniqueVendors: 1,
      scaleTicks: ["0", "1K", "2K", "3K", "5K"],
      barWidthPercent: 40,
      vendors: [
        { name: "Delta Engineering", contracts: 1, percent: "100%", barColor: "#008272" }
      ]
    },
    "Orbit Networks": {
      totalValue: "50K",
      totalContracts: 1,
      avgPerContract: "50K",
      uniqueVendors: 1,
      scaleTicks: ["0", "25K", "50K", "75K", "100K"],
      barWidthPercent: 50,
      vendors: [
        { name: "Orbit Networks", contracts: 1, percent: "100%", barColor: "#008272" }
      ]
    }
  }
};
