// Perioperative medication safety alerts based on:
// - RCSEng Perioperative Medicine Guidelines
// - RCSI / HSE perioperative care pathways
// - NICE NG45 (medicines optimisation in perioperative care)
// - AAGBI / BOA VTE prophylaxis guidance
// - ERAS Society enhanced recovery protocols

export const PERIOP_DRUG_DATABASE = {
  // ---- ANTIPLATELETS ----
  "Aspirin 75mg OD": {
    class: "Antiplatelet",
    agent: "Aspirin",
    action: "Continue",
    rationale: "Low-dose aspirin: CONTINUE for most surgeries (including cardiac, vascular, NOF fracture). Hold only for specific high-bleeding-risk procedures per surgeon (e.g., neurosurgery, posterior chamber eye surgery, TURP). For NOF fracture surgery, aspirin is NOT routinely held (RCSEng/BOA guidance).",
    monitoring: "Continue perioperatively. Monitor for bleeding complications.",
    timeline: "Continue through surgery.",
    urgency: "low",
    source: "NICE NG45; RCSEng Perioperative Medicine; BOA Blue Book (NOF fracture)",
  },
  "Aspirin 150mg OD": {
    class: "Antiplatelet",
    agent: "Aspirin",
    action: "Continue",
    rationale: "Higher-dose aspirin: Continue for secondary prevention. Same perioperative approach as 75mg. Do NOT stop without cardiology input if secondary prevention indication.",
    monitoring: "Monitor for bleeding.",
    timeline: "Continue through surgery.",
    urgency: "low",
    source: "NICE NG45; RCSEng Perioperative Medicine",
  },
  "Clopidogrel 75mg OD": {
    class: "Antiplatelet",
    agent: "Clopidogrel",
    action: "Hold 5-7 days",
    rationale: "Hold 5-7 days pre-surgery for most procedures. EXCEPTION: If patient has recent coronary stent (<12 months DES, <6 months BMS), DO NOT hold — contact cardiology. For NOF fracture surgery, individualise: if clopidogrel cannot be stopped, surgery should not be delayed indefinitely (early fixation within 48h is priority). Discuss with anaesthesia and surgeon.",
    monitoring: "Risk of stent thrombosis if held prematurely. Cardiology input if recent PCI/stent.",
    timeline: "Stop 5-7 days pre-op. Restart 24h post-op if haemostasis secured.",
    urgency: "high",
    source: "NICE NG45; RCSEng; AAGBI; BOA Blue Book",
  },
  "Clopidogrel 300mg loading": {
    class: "Antiplatelet",
    agent: "Clopidogrel (loading)",
    action: "Hold 5-7 days",
    rationale: "Loading dose clopidogrel: stop 5-7 days pre-op. If recent ACS/PCI, URGENT cardiology consult before stopping. High risk of stent thrombosis.",
    monitoring: "Cardiology review mandatory before holding.",
    timeline: "Stop 5-7 days pre-op. Restart post-op once haemostasis confirmed.",
    urgency: "high",
    source: "NICE NG45; RCSEng; ESC dual antiplatelet guidelines",
  },
  "Ticagrelor 90mg BD": {
    class: "Antiplatelet",
    agent: "Ticagrelor",
    action: "Hold 3-5 days",
    rationale: "Hold 3-5 days pre-surgery. Shorter hold than clopidogrel due to reversible action. If recent ACS (<12 months), cardiology MUST review before stopping — risk of stent thrombosis.",
    monitoring: "Cardiology input if recent PCI/stent. Monitor for bleeding.",
    timeline: "Stop 3-5 days pre-op. Restart within 24-72h post-op.",
    urgency: "high",
    source: "NICE NG45; RCSEng; ESC DAPT guidelines",
  },
  "Dual antiplatelet therapy": {
    class: "Antiplatelet",
    agent: "Dual antiplatelet (DAPT)",
    action: "Urgent Cardiology",
    rationale: "DUAL ANTIPLATELET THERAPY: HIGH RISK. Do NOT stop without cardiology review. If recent stent (<12 months), stopping carries significant stent thrombosis risk (potentially fatal). For emergency surgery, continue if <6 months post-DES, or hold P2Y12 inhibitor only if >6 months and surgery cannot wait. Bridge with IV antiplatelet if critical.",
    monitoring: "Mandatory cardiology + anaesthesia MDT discussion.",
    timeline: "Do not stop without cardiology approval.",
    urgency: "critical",
    source: "ESC DAPT guidelines; RCSEng Perioperative Medicine; AAGBI",
  },

  // ---- DOACs ----
  "Apixaban 2.5mg BD": {
    class: "DOAC",
    agent: "Apixaban",
    action: "Hold 24-48h",
    rationale: "Hold apixaban for 24h (standard bleeding risk) or 48h (high bleeding risk surgery) pre-op. Restart 24-48h post-op once haemostasis secured. No bridging required for most patients (DOACs have short half-life ~12h). Check renal function — prolonged hold if eGFR <30 (half-life extended).",
    monitoring: "Check eGFR. No bridging needed in most cases.",
    timeline: "Last dose 24-48h pre-op. Restart 24-48h post-op.",
    urgency: "medium",
    source: "NICE NG45; RCSEng; AAGBI DOAC perioperative guidance",
  },
  "Apixaban 5mg BD": {
    class: "DOAC",
    agent: "Apixaban",
    action: "Hold 24-48h",
    rationale: "Hold 24h (standard bleeding risk) or 48h (high bleeding risk) pre-op. Restart 24-48h post-op. No bridging typically required. If eGFR <30, extend hold to 48-72h. For spinal/neuraxial anaesthesia, hold at least 48h and confirm normal coagulation before needle placement.",
    monitoring: "Check eGFR. If neuraxial anaesthesia planned, hold ≥48h.",
    timeline: "Last dose 24-48h pre-op. Restart 24-48h post-op.",
    urgency: "medium",
    source: "NICE NG45; RCSEng; AAGBI; ESRA neuraxial guidelines",
  },
  "Apixaban 10mg BD": {
    class: "DOAC",
    agent: "Apixaban",
    action: "Hold 24-48h",
    rationale: "High-dose apixaban (treatment dose for acute VTE): Hold 24-48h pre-op depending on bleeding risk. If acute VTE (<1 month), consider bridging with LMWH — discuss with haematology. Restart when haemostasis secured.",
    monitoring: "Check eGFR. Haematology input if recent VTE.",
    timeline: "Last dose 24-48h pre-op. Restart 24-48h post-op.",
    urgency: "medium",
    source: "NICE NG45; RCSEng; AAGBI DOAC guidance",
  },
  "Rivaroxaban 15mg OD": {
    class: "DOAC",
    agent: "Rivaroxaban",
    action: "Hold 24-48h",
    rationale: "Hold 24h (standard risk) or 48h (high risk) pre-op. Once-daily dosing means timing matters: take last dose 24-48h before surgery. No bridging typically. Check renal function — if eGFR <30, extend hold to 48h. For neuraxial anaesthesia, hold ≥48h.",
    monitoring: "Check eGFR. If neuraxial planned, hold ≥48h.",
    timeline: "Last dose 24-48h pre-op. Restart 24-48h post-op.",
    urgency: "medium",
    source: "NICE NG45; RCSEng; AAGBI DOAC guidance",
  },
  "Rivaroxaban 20mg OD": {
    class: "DOAC",
    agent: "Rivaroxaban",
    action: "Hold 24-48h",
    rationale: "Hold 24-48h pre-op based on bleeding risk. If eGFR <30, extend hold to 48-72h. No bridging required for most patients. Restart post-op when haemostasis secured. For neuraxial anaesthesia, hold ≥48h.",
    monitoring: "Check eGFR. Neuraxial: hold ≥48h.",
    timeline: "Last dose 24-48h pre-op. Restart 24-48h post-op.",
    urgency: "medium",
    source: "NICE NG45; RCSEng; AAGBI DOAC guidance",
  },
  "Dabigatran 110mg BD": {
    class: "DOAC",
    agent: "Dabigatran",
    action: "Hold 24-72h",
    rationale: "Dabigatran is predominantly renally cleared (80%). Hold 24h if eGFR >80, 48h if eGFR 50-80, 72h if eGFR 30-50, and up to 96h if eGFR <30. CONTRAINDICATED if eGFR <30 for some indications. Check renal function BEFORE deciding hold time.",
    monitoring: "MANDATORY: check eGFR. Extended hold if renal impairment.",
    timeline: "24-96h depending on eGFR. Restart when haemostasis secured.",
    urgency: "high",
    source: "NICE NG45; RCSEng; AAGBI; BNF dabigatran renal dosing",
  },
  "Dabigatran 150mg BD": {
    class: "DOAC",
    agent: "Dabigatran",
    action: "Hold 24-72h",
    rationale: "High-dose dabigatran: renal clearance critical. Hold 24h (eGFR >80) up to 96h (eGFR <30). Check eGFR before surgery. If eGFR <30, discuss alternative anticoagulation with haematology. Neuraxial: hold ≥48h regardless of renal function.",
    monitoring: "MANDATORY: check eGFR. Neuraxial: hold ≥48h minimum.",
    timeline: "24-96h based on eGFR. Restart post-haemostasis.",
    urgency: "high",
    source: "NICE NG45; RCSEng; AAGBI; ESRA neuraxial guidelines",
  },
  "Edoxaban 30mg OD": {
    class: "DOAC",
    agent: "Edoxaban",
    action: "Hold 24-48h",
    rationale: "Hold 24h (standard risk) or 48h (high risk) pre-op. No bridging typically required. Check eGFR — if <30, extended hold. Neuraxial: hold ≥48h.",
    monitoring: "Check eGFR. Neuraxial: hold ≥48h.",
    timeline: "Last dose 24-48h pre-op. Restart 24-48h post-op.",
    urgency: "medium",
    source: "NICE NG45; RCSEng; AAGBI DOAC guidance",
  },
  "Edoxaban 60mg OD": {
    class: "DOAC",
    agent: "Edoxaban",
    action: "Hold 24-48h",
    rationale: "Hold 24-48h pre-op. No routine bridging. Check eGFR; if <30, extend hold. Neuraxial anaesthesia: hold ≥48h.",
    monitoring: "Check eGFR. Neuraxial: hold ≥48h.",
    timeline: "Last dose 24-48h pre-op. Restart 24-48h post-op.",
    urgency: "medium",
    source: "NICE NG45; RCSEng; AAGBI DOAC guidance",
  },

  // ---- VKA ----
  "Warfarin (variable dose)": {
    class: "Vitamin K Antagonist",
    agent: "Warfarin",
    action: "Hold 5 days + bridge",
    rationale: "Stop warfarin 5 days pre-op. Check INR on day before surgery — must be <1.5 for most surgery, <1.2 for neurosurgery. BRIDGE with LMWH if high thrombotic risk (mechanical heart valve, AF with high CHA2DS2-VASc, recent VTE <3 months). Stop bridging LMWH 24h pre-op. Restart warfarin 12-24h post-op if haemostasis secured. If urgent surgery: give vitamin K 1-5mg IV (reverses in 6-12h) or Beriplex/PCC if immediate reversal needed.",
    monitoring: "Check INR day before surgery. Must be <1.5. Bridging decision based on thrombotic risk.",
    timeline: "Stop 5 days pre-op. INR check day before. Bridge if high risk. Restart 12-24h post-op.",
    urgency: "high",
    source: "NICE NG45; RCSEng; BSH bridging guidelines; AAGBI",
  },

  // ---- LMWH ----
  "Enoxaparin 40mg OD (prophylaxis)": {
    class: "LMWH",
    agent: "Enoxaparin (prophylaxis)",
    action: "Continue / adjust",
    rationale: "Standard VTE prophylaxis dose: Continue perioperatively for surgical patients. Give at 6-8pm evening dose (standard hospital protocol). Hold morning dose on day of surgery if neuraxial anaesthesia planned — last LMWH dose must be ≥12h before spinal/epidural. Resume 4h post-neuraxial procedure or per anaesthesia protocol.",
    monitoring: "For neuraxial: last dose ≥12h before needle placement. Platelet count if >7 days therapy (monitor for HIT).",
    timeline: "Continue prophylactic dosing. Neuraxial: hold 12h pre-procedure.",
    urgency: "low",
    source: "NICE NG89 (VTE prophylaxis); RCSEng; BOA/BOAST VTE guidance",
  },
  "Enoxaparin 1mg/kg BD (treatment)": {
    class: "LMWH",
    agent: "Enoxaparin (treatment)",
    action: "Hold 24h / bridge",
    rationale: "Treatment-dose LMWH: Hold 24h before surgery (last dose 24h pre-op). If active/recent VTE (<3 months), discuss bridging strategy with haematology. Do NOT give treatment-dose LMWH within 24h of neuraxial procedure (wait ≥24h). Resume treatment dose 48-72h post-op depending on bleeding risk.",
    monitoring: "Last dose ≥24h before surgery. Neuraxial: wait ≥24h. Monitor platelets for HIT.",
    timeline: "Last dose 24h pre-op. Resume treatment dose 48-72h post-op if safe.",
    urgency: "high",
    source: "NICE NG45; RCSEng; AAGBI; ASRA neuraxial anticoagulation guidelines",
  },
  "Tinzaparin 4500IU OD": {
    class: "LMWH",
    agent: "Tinzaparin (prophylaxis)",
    action: "Continue / adjust",
    rationale: "VTE prophylaxis dose: continue perioperatively. Standard evening dosing. For neuraxial anaesthesia, last dose ≥12h before needle placement. Resume 4h post-procedure.",
    monitoring: "Neuraxial: hold 12h pre-procedure.",
    timeline: "Continue prophylactic dosing.",
    urgency: "low",
    source: "NICE NG89; RCSEng; BOA VTE guidance",
  },
  "Dalteparin 5000IU OD": {
    class: "LMWH",
    agent: "Dalteparin (prophylaxis)",
    action: "Continue / adjust",
    rationale: "VTE prophylaxis: continue perioperatively. Evening dosing. Neuraxial: last dose ≥12h before needle placement. Resume 4h post-procedure.",
    monitoring: "Neuraxial: hold 12h pre-procedure.",
    timeline: "Continue prophylactic dosing.",
    urgency: "low",
    source: "NICE NG89; RCSEng; BOA VTE guidance",
  },
};

// ---- STEROID ALERTS ----
export const STEROID_ALERTS = {
  prednisolone: {
    match: /prednis(ol)?one/i,
    title: "Chronic Corticosteroid Therapy — Adrenal Suppression Risk",
    severity: "critical",
    rationale: "Patients on long-term corticosteroids (≥3 months at ≥5mg prednisolone daily, or equivalent) have hypothalamic-pituitary-adrenal (HPA) axis suppression. They CANNOT mount a stress cortisol response to surgery, risking acute adrenal crisis (hypotension, shock, death).",
    action: [
      "PERIOPERATIVE HYDROCORTISONE STRESS DOSING REQUIRED",
      "Minor surgery: Hydrocortisone 25mg IV/IM at induction (usual daily dose continues)",
      "Moderate surgery: Hydrocortisone 25mg IV at induction, then 25mg every 8h for 24h, then resume normal dose",
      "Major surgery: Hydrocortisone 50mg IV at induction, then 50mg every 8h for 24-48h, then taper to 25mg every 8h, then resume normal dose",
      "If patient unable to take PO post-op: IV hydrocortisone continued until oral intake resumes",
      "ALSO: Continue patient's usual morning steroid dose pre-op (do NOT omit)",
      "Monitor BP, electrolytes (Na+/K+), glucose; watch for hyponatraemia, hyperkalaemia, hypoglycaemia",
    ],
    source: "RCSI Perioperative Guidelines; RCSEng; AAGBI; Endocrine Society steroid replacement guidelines",
  },
  dexamethasone: {
    match: /dexamethas(ol)?one?/i,
    title: "Dexamethasone — HPA Axis Suppression",
    severity: "high",
    rationale: "Long-term dexamethasone causes HPA suppression. Longer biological half-life than prednisolone.",
    action: [
      "Assess duration and dose. If ≥1mg daily for >3 weeks, HPA suppression likely.",
      "Perioperative hydrocortisone stress cover as per prednisolone protocol above.",
      "Continue usual morning dose pre-op.",
      "Dexamethasone also commonly used as SINGLE antiemetic dose (4-8mg) perioperatively — this is safe and does not require stress dosing.",
    ],
    source: "RCSEng; Endocrine Society; AAGBI",
  },
  hydrocortisone: {
    match: /hydrocortisone/i,
    title: "Hydrocortisone Replacement Therapy",
    severity: "medium",
    rationale: "If on hydrocortisone for adrenal insufficiency (Addison's, congenital adrenal hyperplasia), patient already on replacement and needs stress dose cover.",
    action: [
      "Double the usual morning dose on day of surgery, OR",
      "Hydrocortisone 50-100mg IM/IV at induction for moderate/major surgery",
      "If Addison's disease: hydrocortisone 50mg IV at induction, 50mg every 8h x 24h, then taper",
      "Must NOT miss doses — risk of Addisonian crisis",
    ],
    source: "Endocrine Society; RCSEng; AAGBI",
  },
  methylprednisolone: {
    match: /methylprednis(ol)?one/i,
    title: "Methylprednisolone — HPA Suppression",
    severity: "high",
    rationale: "Long-term methylprednisolone causes HPA suppression similar to prednisolone.",
    action: [
      "If >3 months regular use: perioperative hydrocortisone stress dosing required (see prednisolone protocol).",
      "Continue usual morning dose pre-op.",
    ],
    source: "RCSEng; Endocrine Society; AAGBI",
  },
};

// ---- DIABETES ALERTS ----
export const DIABETES_ALERTS = {
  type1: {
    match: /type\s*1|t1dm|t1d\b|insulin\s*dependent|iddm/i,
    title: "Type 1 Diabetes Mellitus — NEVER Stop Insulin",
    severity: "critical",
    rationale: "Type 1 diabetics have absolute insulin deficiency. Stopping insulin causes DKA within hours, regardless of fasting status. They need a continuous supply of insulin (basal) at ALL times, even when NBM.",
    action: [
      "NEVER completely stop insulin in T1DM",
      "Pre-op: Admit patient or manage via day-case diabetic pathway. Morning surgery preferred.",
      "Insulin regimen on day of surgery: Continue basal insulin (e.g., glargine/levemir) at usual dose OR reduce by 20-30% if prone to hypos. Alternatively, use variable rate IV insulin infusion (VRIII) if fasting >1 meal or complex surgery.",
      "If VRIII used: concurrent 10% glucose + K+ infusion running alongside (standard protocol: 500ml 10% glucose + 10mmol KCl, run at 80ml/h with insulin sliding scale)",
      "Monitor CBG every 1-2h perioperatively. Target 6-10 mmol/L.",
      "Monitor U&Es and ketones if unwell or glucose >14",
      "Post-op: Return to normal regimen when eating and drinking normally",
      "FIRST on theatre list if possible (minimise fasting time)",
    ],
    source: "NICE NG28 (T1DM); JBDS-IP perioperative diabetes guidelines; RCSI; RCSEng",
  },
  type2: {
    match: /type\s*2|t2dm|t2d\b|non-insulin\s*dependent|niddm/i,
    title: "Type 2 Diabetes Mellitus — Medication Adjustment",
    severity: "high",
    rationale: "T2DM patients need medication adjustment perioperatively to avoid hypoglycaemia (while NBM) and hyperglycaemia (surgical stress). Approach depends on medication class and procedure timing.",
    action: [
      "FIRST on theatre list preferred (minimise fasting)",
      "METFORMIN: Continue if eGFR >60 and procedure involves contrast, hold on morning of surgery. If eGFR 30-60 and contrast: hold 48h. If minor surgery with short fast: continue. If major surgery or prolonged fast: hold on morning, resume when eating.",
      "SGLT2 INHIBITORS (dapagliflozin, empagliflozin): STOP at least 3 days pre-surgery (risk of euglycaemic DKA). Do not restart until clinically stable and eating normally.",
      "SULPHONYLUREAS (gliclazide, glipizide): Omit morning dose on day of surgery (hypoglycaemia risk while fasting). Resume post-op when eating.",
      "DPP-4 INHIBITORS (sitagliptin, linagliptin): Omit on day of surgery. Safe to resume post-op.",
      "GLP-1 AGONISTS (semaglutide, liraglutide, dulaglutide): HOLD on day of surgery (delayed gastric emptying risk → aspiration). If long-acting weekly: hold 1 week before. Consider as 'full stomach' for anaesthesia.",
      "PIGLITAZONE: Omit on day of surgery.",
      "If on INSULIN (T2DM): Reduce basal insulin by 20-30% on morning of surgery. Omit rapid-acting/bolus insulin while fasting. Monitor CBG every 2h. Consider VRIII if prolonged fast or major surgery.",
      "Target CBG: 6-10 mmol/L (acceptable 4-12)",
      "Post-op: Resume normal medications when eating and drinking normally",
    ],
    source: "NICE NG28 (T2DM); JBDS-IP perioperative diabetes; RCSEng; RCSI; AAGBI",
  },
  insulin: {
    match: /insulin|novorapid|humalog|lantus|levemir|tresiba|lantus|glargine|detemir|degludec/i,
    title: "Insulin Therapy — Perioperative Adjustment",
    severity: "critical",
    rationale: "Insulin requires careful perioperative management. T1DM: never stop. T2DM: reduce basal, omit bolus. Variable rate IV insulin infusion (VRIII) for prolonged fasting or major surgery.",
    action: [
      "Basal insulin (glargine/levemir): Continue at 80% of usual dose (reduce 20%) on morning of surgery for T1DM and insulin-treated T2DM",
      "Bolus/rapid-acting (Novorapid/Humalog): OMIT while fasting. Resume with first meal post-op.",
      "Mixed/biphasic insulin: Omit morning dose. Consider VRIII if fasting >1 meal missed.",
      "VRIII: If major surgery, prolonged fasting, or poor control (HbA1c >69): Start variable rate IV insulin infusion with concurrent 10% glucose + K+ running at 80ml/h. Check CBG + ketones + K+ every 1-2h.",
      "Target glucose: 6-10 mmol/L",
      "FIRST on theatre list whenever possible",
    ],
    source: "JBDS-IP; NICE NG28; RCSEng; AAGBI",
  },
};

// ---- ANTICHOLINERGIC & DELIRIUM RISK ----
export const DELIRIUM_RISK_MEDS = {
  anticholinergic: {
    match: /oxybutynin|solifenacin|tolterodine|darifenacin|fesoterodine|amitriptyline|nortriptyline|imipramine|doxepin|hyoscine|atropine|cyclizine|promethazine|chlorphenamine|trihexyphenidyl|procyclidine|orphenadrine|clozapine|olanzapine|quetiapine/i,
    title: "Anticholinergic Medication — Delirium Risk in Elderly",
    severity: "high",
    rationale: "Anticholinergic burden is a major risk factor for perioperative delirium, especially in elderly patients (≥65). These medications cross the blood-brain barrier and can cause confusion, urinary retention, constipation, dry mouth, and blurred vision. The Beer's Criteria and NICE delirium guidelines both flag these as high-risk in older surgical patients.",
    action: [
      "ASSESS ANTICHOLINERGIC BURDEN: Use Anticholinergic Burden Scale (ACB). Score ≥3 = high risk of delirium/cognitive impairment",
      "Consider REVIEWING and DEPRESCRIBING where possible pre-operatively (discuss with prescribing team)",
      "For NOF fracture / elderly orthopaedic patients: HIGH PRIORITY — delirium is associated with increased mortality, longer LOS, poorer functional recovery",
      "Post-op: Monitor for delirium using 4AT or CAM. Implement HELP (Hospital Elder Life Program) interventions: orientation, hydration, sensory aids, mobility, sleep hygiene.",
      "AVOID adding new anticholinergics post-op (e.g., avoid oxybutynin for new urinary retention — use catheterisation or mirabegron instead)",
      "If new-onset delirium: rule out causes (infection, hypoxia, electrolyte derangement, pain, urinary retention, constipation, medications) BEFORE considering pharmacological treatment",
      "Pharmacological treatment of severe/agitated delirium: HALOPERIDOL 0.5-1mg PO/IM (low dose, elderly) — avoid if Parkinsonism/QT prolongation. Benzodiazepines AVOID unless alcohol/benzodiazepine withdrawal.",
    ],
    source: "NICE CG161 (Delirium); RCSEng Perioperative Medicine of Older People; Beer's Criteria; 4AT delirium screening; HELP protocol",
  },
  benzodiazepine: {
    match: /diazepam|lorazepam|temazepam|clonazepam|alprazolam|oxazepam|chlordiazepoxide|zopiclone|zolpidem/i,
    title: "Benzodiazepine / Z-Drug — Delirium & Fall Risk",
    severity: "high",
    rationale: "Benzodiazepines and Z-drugs are independently associated with postoperative delirium, falls, and prolonged hospital stay in elderly patients. They also carry dependence/withdrawal risk if stopped abruptly.",
    action: [
      "Do NOT stop suddenly if long-term use (risk of withdrawal seizures). Continue usual dose perioperatively.",
      "AVOID prescribing new benzodiazepines for sleep/agitation post-op in elderly",
      "If alcohol dependence suspected: assess withdrawal risk (CIWA-Ar). Consider chlordiazepoxide reducing regime or lorazepam if liver impairment.",
      "Post-op delirium: benzodiazepines can WORSEN delirium (except in alcohol/benzo withdrawal where they are first-line)",
      "Monitor for oversedation, falls, respiratory depression",
    ],
    source: "NICE CG161; RCSEng; Beer's Criteria; SIGN 157 (managing delirium)",
  },
  opioid: {
    match: /morphine|oxycodone|codeine|tramadol|fentanyl|hydromorphone|buprenorphine|tapentadol/i,
    title: "Opioid — Delirium & Constipation Risk",
    severity: "medium",
    rationale: "Opioids contribute to postoperative delirium (especially in elderly), respiratory depression, constipation, and urinary retention. Codeine is unreliable in about 10% of Caucasians (CYP2D6 poor metabolisers) and can be toxic in ultrarapid metabolisers.",
    action: [
      "Use multimodal analgesia (paracetamol + regional block + NSAID if appropriate) to minimise opioid use",
      "In elderly: START LOW, GO SLOW. Morphine dose reduced by 50% in age >70.",
      "AVOID codeine in elderly where possible (unpredictable metabolism). Use oral morphine solution at reduced dose instead.",
      "Monitor for: oversedation (RR, sedation score), constipation ( prescribe stimulant laxative prophylactically), urinary retention",
      "Pain itself causes delirium — ensure adequate analgesia but avoid over-sedation",
      "Consider fascia iliaca block / regional anaesthesia for hip fracture patients (reduces opioid requirement, reduces delirium)",
      "If PCA used: no basal infusion in opioid-naïve elderly patients",
    ],
    source: "NICE CG161; RCSEng; AAGBI; BOA/BOAST (hip fracture); Enhanced Recovery (ERAS) protocols",
  },
};

// ---- ERAS / FASTING ALERTS ----
export function checkFastingStatus(lastMealTime, lastDrinkTime, currentTime = new Date()) {
  const alerts = [];
  if (!lastMealTime && !lastDrinkTime) return alerts;

  if (lastMealTime) {
    const meal = new Date(lastMealTime);
    const hoursSinceMeal = (currentTime - meal) / (1000 * 60 * 60);

    if (hoursSinceMeal < 6) {
      alerts.push({
        severity: "critical",
        title: "Insufficient Fasting Time — Solid Food",
        detail: `Last solid food was ${hoursSinceMeal.toFixed(1)}h ago. Standard fasting: 6h for solids, 2h for clear fluids (AAGBI/RCSEng). Patient may need surgery delayed OR considered as 'full stomach' for anaesthesia (rapid sequence induction).`,
        action: "If emergency surgery: treat as full stomach → RSI. If elective: delay until 6h from last solid food.",
        source: "AAGBI fasting guidelines; RCSEng; NICE CG32 (perioperative fasting)",
      });
    }
  }

  if (lastDrinkTime) {
    const drink = new Date(lastDrinkTime);
    const hoursSinceDrink = (currentTime - drink) / (1000 * 60 * 60);

    if (hoursSinceDrink < 2) {
      alerts.push({
        severity: "medium",
        title: "Recent Clear Fluid Intake",
        detail: `Last clear fluid was ${hoursSinceDrink.toFixed(1)}h ago. Standard: 2h for clear fluids. Encouraging preoperative fluids (up to 2h before) is part of ERAS protocol to prevent dehydration.`,
        action: "If <2h: discuss with anaesthetist. ERAS encourages clear fluids up to 2h pre-op to reduce dehydration and insulin resistance.",
        source: "ERAS Society; AAGBI; RCSEng enhanced recovery",
      });
    }
  }

  // Dehydration risk
  if (lastDrinkTime) {
    const drink = new Date(lastDrinkTime);
    const hoursSinceDrink = (currentTime - drink) / (1000 * 60 * 60);

    if (hoursSinceDrink > 8) {
      alerts.push({
        severity: "high",
        title: "Dehydration Risk — Prolonged Fluid Restriction",
        detail: `Last fluid intake was ${hoursSinceDrink.toFixed(1)}h ago. Prolonged fasting causes dehydration, insulin resistance, electrolyte derangement, and delays recovery (ERAS protocol violation).`,
        action: [
          "Start IV maintenance fluids (Hartmann's or 0.9% NaCl + KCl) if fasting >8h",
          "Consider VRIII if diabetic",
          "ERAS: clear fluids should be encouraged up to 2h pre-op",
          "Assess for clinical dehydration: capillary refill, mucous membranes, urine output, turgor",
          "Check U&Es if prolonged fasting — watch for hyponatraemia, hypokalaemia, AKI",
        ].join("; "),
        source: "ERAS Society; RCSEng Enhanced Recovery; NICE CG32",
      });
    }
  }

  return alerts;
}

// ---- MAIN ALERT GENERATOR ----
export function generatePeriopAlerts(meds = [], comorbidities = "", caseData = {}) {
  const alerts = [];
  const medText = (meds || []).join(" ");
  const allText = `${medText} ${comorbidities || ""}`.toLowerCase();

  // 1. Perioperative medication alerts (anticoagulants/antiplatelets)
  for (const med of meds || []) {
    const info = PERIOP_DRUG_DATABASE[med];
    if (info) {
      alerts.push({
        category: "Anticoagulation / Antiplatelet",
        severity: info.urgency,
        title: `${info.class} — ${info.agent}`,
        detail: info.rationale,
        action: info.action,
        monitoring: info.monitoring,
        timeline: info.timeline,
        source: info.source,
        drug: med,
      });
    }
  }

  // 2. Steroid alerts
  for (const [, info] of Object.entries(STEROID_ALERTS)) {
    if (info.match.test(allText)) {
      alerts.push({
        category: "Corticosteroid",
        severity: info.severity,
        title: info.title,
        detail: info.rationale,
        action: Array.isArray(info.action) ? info.action.join("\n") : info.action,
        source: info.source,
      });
    }
  }

  // 3. Diabetes alerts
  for (const [, info] of Object.entries(DIABETES_ALERTS)) {
    if (info.match.test(allText)) {
      alerts.push({
        category: "Diabetes Management",
        severity: info.severity,
        title: info.title,
        detail: info.rationale,
        action: Array.isArray(info.action) ? info.action.join("\n") : info.action,
        source: info.source,
      });
    }
  }

  // 4. Delirium / anticholinergic risk
  for (const [, info] of Object.entries(DELIRIUM_RISK_MEDS)) {
    if (info.match.test(allText)) {
      alerts.push({
        category: "Delirium Risk",
        severity: info.severity,
        title: info.title,
        detail: info.rationale,
        action: Array.isArray(info.action) ? info.action.join("\n") : info.action,
        source: info.source,
      });
    }
  }

  // 5. Age-based delirium risk
  if (caseData.patient_dob) {
    const age = Math.floor((Date.now() - new Date(caseData.patient_dob)) / (1000 * 60 * 60 * 24 * 365.25));
    if (age >= 65) {
      alerts.push({
        category: "Geriatric Risk",
        severity: "medium",
        title: `Elderly Patient (Age ${age}) — Delirium Risk`,
        detail: "Patients ≥65 are at significantly increased risk of postoperative delirium, especially after hip fracture surgery or emergency admission. Delirium is associated with increased mortality, longer hospital stay, and poorer functional recovery.",
        action: [
          "Screen for delirium on admission and daily (4AT or CAM)",
          "Implement delirium prevention: orientation cues, clocks, sensory aids (glasses/hearing aids), hydration, early mobilisation, sleep hygiene",
          "Optimise pain control with multimodal analgesia (minimise opioids)",
          "Review medications for anticholinergic burden",
          "Address constipation, urinary retention, infection",
          "Treat hypoxia, hypotension, electrolyte derangements promptly",
          "Involve geriatric medicine / orthogeriatrics MDT",
        ].join("\n"),
        source: "NICE CG161; RCSEng Perioperative Medicine of Older People; BOA hip fracture standards",
      });
    }
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  alerts.sort((a, b) => (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4));

  return alerts;
}

export function getSeverityColor(severity) {
  const colors = {
    critical: "destructive",
    high: "destructive",
    medium: "warning",
    low: "accent",
  };
  return colors[severity] || "muted";
}

export function getSeverityIcon(severity) {
  const icons = {
    critical: "🔥",
    high: "⚠️",
    medium: "⚡",
    low: "ℹ️",
  };
  return icons[severity] || "ℹ️";
}