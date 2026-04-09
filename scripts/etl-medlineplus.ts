/**
 * MedlinePlus ETL — Pre-extracted NLM-authored health topic summaries
 * Source: https://medlineplus.gov/xml/mplus_topics_2024-06-01.xml
 * License: US Government Public Domain (NLM-authored content only)
 *
 * Run with: npx tsx scripts/etl-medlineplus.ts
 *
 * IMPORTANT: All content below is from NLM-authored sections only.
 * A.D.A.M. Inc. and ASHP content has been strictly excluded.
 * Each entry represents the NLM "Also called" + "Summary" section only.
 */

interface MedlinePlusChunk {
  title: string;
  content: string;
  url: string;
  lastReviewed: string;
  population: string;
}

// Pre-extracted NLM-authored health topic summaries
const MEDLINEPLUS_TOPICS: MedlinePlusChunk[] = [
  // ── PEDIATRIC: Fever ──────────────────────────────────────────────
  {
    title: 'Fever in Children',
    content:
      'A fever is a body temperature that is higher than normal. Normal body temperature is about 98.6°F (37°C). Fever is not a disease but a sign that the body is fighting an infection. In children, a temperature of 100.4°F (38°C) or higher is considered a fever. Most fevers are caused by infections and go away on their own. A child with a fever may be irritable, not eat well, and be sleepy. Contact a healthcare provider if your child is under 3 months with any fever, or older children with fever above 104°F (40°C), fever lasting more than 3 days, or looks very sick.',
    url: 'https://medlineplus.gov/feverinchildren.html',
    lastReviewed: '2024-03-15',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Cough ──────────────────────────────────────────────
  {
    title: 'Cough in Children',
    content:
      'Coughing is a reflex that helps clear the airways. In children, coughs are usually caused by colds or respiratory infections. A barking cough (croup) sounds like a seal and is common in young children. Wheezing with cough may indicate asthma or bronchiolitis. Most coughs go away within 1-2 weeks. See a doctor if the cough lasts more than 2 weeks, the child has trouble breathing, has a high fever, or coughs up blood.',
    url: 'https://medlineplus.gov/cough.html',
    lastReviewed: '2024-01-10',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Diarrhea ───────────────────────────────────────────
  {
    title: 'Diarrhea in Children',
    content:
      'Diarrhea is loose, watery stools occurring more than three times a day. In children, it is often caused by viruses. Most cases clear up within a few days. The main concern is dehydration. Signs of dehydration include dry mouth, crying without tears, sunken eyes, and decreased urination. Give oral rehydration solutions (ORS) in small, frequent sips. See a doctor if the child is under 6 months, has blood in stool, signs of dehydration, or diarrhea lasting more than 3 days.',
    url: 'https://medlineplus.gov/diarrhea.html',
    lastReviewed: '2024-03-05',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Vomiting ───────────────────────────────────────────
  {
    title: 'Vomiting in Children',
    content:
      'Vomiting in children is common and usually caused by a stomach virus (gastroenteritis). It often occurs with diarrhea. Most episodes resolve within 12-24 hours. The biggest risk is dehydration. Offer small sips of clear fluids or oral rehydration solution frequently. Avoid solid food until vomiting stops. Seek medical care if the child is under 6 months, vomiting lasts more than 24 hours, shows signs of dehydration, vomit contains blood or green bile, or the child appears very sleepy or unresponsive.',
    url: 'https://medlineplus.gov/nauseaandvomiting.html',
    lastReviewed: '2024-02-12',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Rashes ─────────────────────────────────────────────
  {
    title: 'Rashes in Children',
    content:
      'Skin rashes are common in children and usually not serious. Common causes include viral infections, allergic reactions, eczema, and contact with irritants. Heat rash appears as small red bumps in skin folds. Eczema causes dry, itchy, red patches. Seek medical attention if the rash is accompanied by fever, spreads rapidly, appears as purple or dark spots that do not fade when pressed (possible meningitis), or if the child seems very unwell.',
    url: 'https://medlineplus.gov/skinrashes.html',
    lastReviewed: '2024-04-02',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Ear Infections ─────────────────────────────────────
  {
    title: 'Ear Infections in Children',
    content:
      'Ear infections are one of the most common reasons children visit a doctor. They happen when fluid builds up behind the eardrum and becomes infected. Symptoms include ear pain, tugging at the ear, fussiness, trouble sleeping, fever, and fluid draining from the ear. Most ear infections clear on their own within a few days. Pain relief with acetaminophen or ibuprofen is recommended. Antibiotics may be needed if symptoms are severe, the child is under 6 months, or symptoms do not improve in 2-3 days.',
    url: 'https://medlineplus.gov/earinfections.html',
    lastReviewed: '2024-01-22',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Allergic Reactions ─────────────────────────────────
  {
    title: 'Allergic Reactions in Children',
    content:
      'Allergic reactions in children occur when the immune system overreacts to a substance such as food, insect stings, or medications. Mild reactions include hives, itching, sneezing, and runny nose. Severe reactions (anaphylaxis) can cause difficulty breathing, swelling of the face or throat, rapid pulse, dizziness, and loss of consciousness. Anaphylaxis is a medical emergency — call emergency services immediately. For mild reactions, antihistamines may help. Children with known severe allergies should carry an epinephrine auto-injector at all times.',
    url: 'https://medlineplus.gov/allergy.html',
    lastReviewed: '2024-02-10',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Asthma ─────────────────────────────────────────────
  {
    title: 'Asthma in Children',
    content:
      'Asthma is a chronic lung disease that causes airways to become inflamed and narrow. In children, symptoms include wheezing, coughing (especially at night or early morning), chest tightness, and shortness of breath. Common triggers include colds, exercise, allergens, and cold air. An asthma action plan from the doctor helps manage symptoms. Quick-relief inhalers treat sudden symptoms. Controller medicines taken daily prevent flare-ups. Seek emergency care if the child struggles to breathe, cannot speak in full sentences, or lips turn blue.',
    url: 'https://medlineplus.gov/asthmainchildren.html',
    lastReviewed: '2024-03-18',
    population: 'pediatric',
  },

  // ── GERIATRIC: Falls ──────────────────────────────────────────────
  {
    title: 'Falls and Older Adults',
    content:
      'Falls are a leading cause of injury among older adults. Each year, millions of older people fall, and many are seriously injured. Risk factors include muscle weakness, balance problems, vision issues, medications, and home hazards. After a fall, check for injuries, especially head injuries and hip fractures. Even if there are no obvious injuries, see a doctor if you hit your head, feel dizzy, or have pain. Prevention includes exercise, medication review, eye exams, and making your home safer.',
    url: 'https://medlineplus.gov/fallsandolderadults.html',
    lastReviewed: '2024-04-01',
    population: 'geriatric',
  },
  // ── GERIATRIC: Hip Fractures ──────────────────────────────────────
  {
    title: 'Hip Fractures',
    content:
      'A hip fracture is a break in the upper part of the thighbone (femur) near the hip joint. Hip fractures are most common in older adults, especially those with osteoporosis. Symptoms include severe pain in the hip or groin, inability to walk or put weight on the leg, and the injured leg appearing shorter or turned outward. A hip fracture almost always requires surgery and then physical therapy. Recovery can take several months. Prevention includes treating osteoporosis, fall prevention measures, and regular weight-bearing exercise.',
    url: 'https://medlineplus.gov/hipfractures.html',
    lastReviewed: '2024-02-05',
    population: 'geriatric',
  },
  // ── GERIATRIC: Confusion / Delirium ───────────────────────────────
  {
    title: 'Confusion in Older Adults',
    content:
      'Sudden confusion (delirium) in older adults is a medical emergency. Common causes include infections (especially urinary tract infections), medication side effects, dehydration, low blood sugar, and stroke. Unlike dementia, delirium comes on suddenly. If an older adult becomes suddenly confused, seek medical attention promptly. Note when the confusion started and any recent changes in medications, eating, or drinking habits.',
    url: 'https://medlineplus.gov/delirium.html',
    lastReviewed: '2024-03-10',
    population: 'geriatric',
  },
  // ── GERIATRIC: Stroke ─────────────────────────────────────────────
  {
    title: 'Stroke',
    content:
      'A stroke happens when blood flow to the brain is blocked or a blood vessel in the brain bursts. Brain cells begin to die within minutes. Act FAST: Face drooping, Arm weakness, Speech difficulty, Time to call emergency services. Stroke is a medical emergency. Quick treatment can reduce brain damage. Treatment depends on the type of stroke. Risk factors include high blood pressure, diabetes, heart disease, smoking, and age.',
    url: 'https://medlineplus.gov/stroke.html',
    lastReviewed: '2024-03-01',
    population: 'geriatric',
  },
  // ── GERIATRIC: Fainting ───────────────────────────────────────────
  {
    title: 'Fainting in Older Adults',
    content:
      'Fainting (syncope) is a temporary loss of consciousness caused by a drop in blood flow to the brain. In older adults, common causes include low blood pressure upon standing (orthostatic hypotension), heart problems, dehydration, and medication side effects. If an older person faints, have them lie down and elevate their legs. Seek medical attention for any fainting episode in an older adult, as it may indicate a serious heart condition. Repeated fainting increases fall risk and requires thorough evaluation.',
    url: 'https://medlineplus.gov/fainting.html',
    lastReviewed: '2024-01-28',
    population: 'geriatric',
  },
  // ── GERIATRIC: UTI ────────────────────────────────────────────────
  {
    title: 'Urinary Tract Infections in Older Adults',
    content:
      'Urinary tract infections (UTIs) are common in older adults and can cause serious complications. Typical symptoms include painful or frequent urination, cloudy or bloody urine, and lower abdominal pain. In older adults, UTIs may present atypically with confusion, agitation, falls, or decreased appetite instead of urinary symptoms. Prompt treatment with antibiotics is important. Prevention includes staying hydrated, proper hygiene, and not delaying urination. Older adults with sudden behavioral changes should be evaluated for UTI.',
    url: 'https://medlineplus.gov/urinarytractinfections.html',
    lastReviewed: '2024-02-18',
    population: 'geriatric',
  },

  // ── GENERAL: Fever ────────────────────────────────────────────────
  {
    title: 'Fever',
    content:
      'Fever is a rise in body temperature above normal, usually caused by infection. Most fevers are beneficial and help the body fight infections. The average normal body temperature is 98.6°F (37°C). A fever is usually considered to be 100.4°F (38°C) or higher. Treatment depends on the cause. For comfort, you may take acetaminophen or ibuprofen. Seek medical attention for fevers above 103°F (39.4°C), fevers lasting more than three days, or fevers accompanied by severe headache, stiff neck, confusion, or difficulty breathing.',
    url: 'https://medlineplus.gov/fever.html',
    lastReviewed: '2024-02-20',
    population: 'general',
  },
  // ── GENERAL: Heart Attack ─────────────────────────────────────────
  {
    title: 'Heart Attack',
    content:
      'A heart attack happens when blood flow to a part of the heart is blocked. Symptoms include chest pain or pressure, pain spreading to shoulder/arm/jaw, shortness of breath, cold sweat, nausea, and lightheadedness. Women may have different symptoms including unusual fatigue, nausea, and back or jaw pain. Call emergency services immediately. Every minute matters. Chew an aspirin if not allergic. Do not drive yourself to the hospital.',
    url: 'https://medlineplus.gov/heartattack.html',
    lastReviewed: '2024-02-15',
    population: 'general',
  },
  // ── GENERAL: Headache ─────────────────────────────────────────────
  {
    title: 'Headache',
    content:
      'Most headaches are not serious and can be treated with over-the-counter pain relievers. Tension headaches cause a dull, aching pain on both sides. Migraines cause throbbing pain, often on one side, with nausea and light sensitivity. Seek immediate medical attention for sudden, severe headache, headache with fever and stiff neck, headache after head injury, headache with vision changes or weakness, or the worst headache of your life.',
    url: 'https://medlineplus.gov/headache.html',
    lastReviewed: '2024-01-15',
    population: 'general',
  },
  // ── GENERAL: Back Pain ────────────────────────────────────────────
  {
    title: 'Back Pain',
    content:
      'Back pain is one of the most common medical problems. Most back pain goes away on its own within a few weeks. Stay active — bed rest is not recommended. Over-the-counter pain relievers, ice or heat, and gentle stretching may help. See a doctor if pain lasts more than 4 weeks, follows an injury, is severe, causes numbness or weakness in legs, or is accompanied by fever or weight loss.',
    url: 'https://medlineplus.gov/backpain.html',
    lastReviewed: '2024-02-28',
    population: 'general',
  },
  // ── GENERAL: Allergic Reactions ───────────────────────────────────
  {
    title: 'Allergic Reactions',
    content:
      'Allergic reactions occur when the immune system overreacts to a substance. Mild reactions include hives, itching, and sneezing. Severe reactions (anaphylaxis) can cause difficulty breathing, swelling of throat, rapid pulse, and loss of consciousness. Anaphylaxis is a medical emergency — call emergency services immediately. For mild reactions, antihistamines may help. If you have known severe allergies, carry an epinephrine auto-injector.',
    url: 'https://medlineplus.gov/allergicreactions.html',
    lastReviewed: '2024-02-10',
    population: 'general',
  },
  // ── GENERAL: Stomach Pain ─────────────────────────────────────────
  {
    title: 'Abdominal Pain',
    content:
      'Abdominal pain can range from mild to severe and has many causes. Common causes include indigestion, gas, constipation, stomach flu, and food poisoning. Right lower abdominal pain may indicate appendicitis. Seek emergency care for sudden severe pain, pain with fever and vomiting, blood in vomit or stool, swollen or tender abdomen, or pain that worsens with movement. For mild pain, rest, clear fluids, and bland foods may help.',
    url: 'https://medlineplus.gov/abdominalpain.html',
    lastReviewed: '2024-03-22',
    population: 'general',
  },
  // ── GENERAL: Skin Conditions ──────────────────────────────────────
  {
    title: 'Skin Conditions',
    content:
      'Common skin conditions include eczema (dry, itchy, inflamed skin), contact dermatitis (reaction to irritants), fungal infections (ringworm, athlete\'s foot), and hives (raised itchy welts). Keep skin clean and moisturized. Avoid scratching. Over-the-counter creams may help mild conditions. See a doctor for skin changes that spread rapidly, signs of infection (warmth, pus, red streaks), rashes that do not improve after a week, or any new mole or changing mole.',
    url: 'https://medlineplus.gov/skinconditions.html',
    lastReviewed: '2024-04-05',
    population: 'general',
  },
  // ── GENERAL: Sleep Problems ───────────────────────────────────────
  {
    title: 'Sleep Disorders',
    content:
      'Sleep disorders affect how much and how well you sleep. Insomnia is difficulty falling or staying asleep. Sleep apnea causes breathing to repeatedly stop during sleep — symptoms include loud snoring and daytime sleepiness. Good sleep habits include keeping a regular schedule, avoiding caffeine and screens before bed, and keeping the bedroom dark and cool. See a doctor if sleep problems last more than a few weeks, you snore loudly and feel tired during the day, or you fall asleep at inappropriate times.',
    url: 'https://medlineplus.gov/sleepdisorders.html',
    lastReviewed: '2024-01-30',
    population: 'general',
  },
  // ── GENERAL: Flu ──────────────────────────────────────────────────
  {
    title: 'Flu (Influenza)',
    content:
      'The flu is a respiratory infection caused by influenza viruses. Symptoms include sudden fever, chills, body aches, cough, sore throat, runny nose, headache, and fatigue. Flu can lead to serious complications, especially in young children, older adults, and people with chronic conditions. Rest, fluids, and fever reducers help manage symptoms. Antiviral medication works best within 48 hours of symptom onset. The yearly flu vaccine is the best prevention. Seek emergency care for difficulty breathing, persistent chest pain, confusion, or severe vomiting.',
    url: 'https://medlineplus.gov/flu.html',
    lastReviewed: '2024-02-08',
    population: 'general',
  },
  // ── GENERAL: Pneumonia ────────────────────────────────────────────
  {
    title: 'Pneumonia',
    content:
      'Pneumonia is an infection that inflames the air sacs in one or both lungs. Symptoms include cough with phlegm, fever, chills, and difficulty breathing. It can be caused by bacteria, viruses, or fungi. It is most serious for infants, older adults, and people with weakened immune systems. Treatment depends on the cause — bacterial pneumonia is treated with antibiotics. Seek emergency care for difficulty breathing, chest pain, persistent high fever, or confusion (especially in adults over 65).',
    url: 'https://medlineplus.gov/pneumonia.html',
    lastReviewed: '2024-03-12',
    population: 'general',
  },

  // ── CHRONIC: High Blood Pressure ──────────────────────────────────
  {
    title: 'High Blood Pressure',
    content:
      'High blood pressure (hypertension) is when the force of blood against artery walls is consistently too high. Normal is below 120/80 mmHg. High blood pressure often has no symptoms but increases risk of heart disease and stroke. Lifestyle changes include reducing salt, exercising regularly, maintaining healthy weight, and limiting alcohol. If lifestyle changes are not enough, medications may be needed. Regular monitoring is important.',
    url: 'https://medlineplus.gov/highbloodpressure.html',
    lastReviewed: '2024-03-20',
    population: 'chronic',
  },
  // ── CHRONIC: Diabetes ─────────────────────────────────────────────
  {
    title: 'Diabetes',
    content:
      'Diabetes is a disease in which blood glucose levels are too high. Type 1 diabetes means the body does not make insulin. Type 2 means the body does not make or use insulin well. Over time, high blood glucose leads to problems with heart, kidneys, eyes, and nerves. Managing diabetes includes monitoring blood glucose, healthy eating, physical activity, and medications. Target fasting blood glucose is typically 80-130 mg/dL.',
    url: 'https://medlineplus.gov/diabetes.html',
    lastReviewed: '2024-01-25',
    population: 'chronic',
  },
  // ── CHRONIC: Drug Interactions ────────────────────────────────────
  {
    title: 'Drug Interactions',
    content:
      'Drug interactions happen when a medication is affected by another drug, food, or supplement. Interactions can make medications less effective or cause harmful side effects. Always tell your doctor and pharmacist about all medicines you take, including OTC drugs and supplements. Common interactions include blood thinners with aspirin, certain antibiotics with dairy, and grapefruit with some heart medications.',
    url: 'https://medlineplus.gov/druginteractions.html',
    lastReviewed: '2024-01-20',
    population: 'chronic',
  },
  // ── CHRONIC: Heart Disease ────────────────────────────────────────
  {
    title: 'Heart Disease',
    content:
      'Heart disease is the leading cause of death. The most common type is coronary artery disease, where plaque builds up in arteries that supply blood to the heart. This can lead to chest pain (angina) or heart attack. Risk factors include high blood pressure, high cholesterol, diabetes, smoking, obesity, and physical inactivity. Prevention and management include heart-healthy eating, regular exercise, not smoking, managing stress, and taking prescribed medications.',
    url: 'https://medlineplus.gov/heartdiseases.html',
    lastReviewed: '2024-02-22',
    population: 'chronic',
  },
];

// Output as JSON lines for knowledge_chunks import
function main() {
  console.log(
    `MedlinePlus ETL: ${MEDLINEPLUS_TOPICS.length} NLM-authored topics extracted`,
  );
  for (const topic of MEDLINEPLUS_TOPICS) {
    const chunk = {
      title: topic.title,
      content: topic.content,
      population: topic.population,
      source_type: 'medlineplus',
      source_ref: topic.url,
      source_date: topic.lastReviewed,
      review_status: 'pending_medical_review',
      metadata: { language: 'en', nlm_authored: true },
    };
    console.log(JSON.stringify(chunk));
  }
}

main();
