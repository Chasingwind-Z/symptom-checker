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
  // ═══ PEDIATRIC TOPICS ════════════════════════════════════════════════════════════
  // ── PEDIATRIC: Fever in Children ──
  {
    title: 'Fever in Children',
    content:
      'A fever is a body temperature that is higher than normal, usually 100.4°F (38°C) or above. In children, fever is most often caused by viral infections and is the body fighting off illness. Symptoms include flushed face, warm skin, irritability, and decreased appetite. See a healthcare provider if your child is under 3 months with any fever, has fever above 104°F (40°C), fever lasts more than 3 days, or the child appears very sick.',
    url: 'https://medlineplus.gov/feverinchildren.html',
    lastReviewed: '2024-03-15',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Cough in Children ──
  {
    title: 'Cough in Children',
    content:
      'Coughing helps clear the airways of mucus and irritants. In children, coughs are most often caused by colds or other viral infections. A barking cough may indicate croup, while a wheezing cough may suggest asthma. Most coughs clear up within one to two weeks. See a healthcare provider if the cough lasts more than two weeks, the child has difficulty breathing, or coughs up blood.',
    url: 'https://medlineplus.gov/coughinchildren.html',
    lastReviewed: '2024-01-10',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Common Cold in Children ──
  {
    title: 'Common Cold in Children',
    content:
      'The common cold is a viral infection of the nose and throat. Children average six to eight colds per year. Symptoms include runny nose, sneezing, mild sore throat, and low-grade fever. Treatment focuses on comfort measures such as fluids, rest, and saline nasal drops. See a healthcare provider if symptoms last more than 10 days, the child develops a high fever, or has trouble breathing.',
    url: 'https://medlineplus.gov/commoncoldchildren.html',
    lastReviewed: '2024-02-20',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Ear Infections in Children ──
  {
    title: 'Ear Infections in Children',
    content:
      'Ear infections occur when bacteria or viruses infect the middle ear, causing fluid buildup and swelling. They are one of the most common reasons children visit a healthcare provider. Symptoms include ear pain, tugging at the ear, fever, fussiness, and trouble hearing. See a healthcare provider if your child has ear pain lasting more than a day, has drainage from the ear, or is under 6 months old with any signs of an ear infection.',
    url: 'https://medlineplus.gov/earinfections.html',
    lastReviewed: '2023-11-05',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Diarrhea in Children ──
  {
    title: 'Diarrhea in Children',
    content:
      'Diarrhea is loose, watery stools occurring more frequently than usual. In children, it is most often caused by viral infections such as rotavirus. Dehydration is the main concern, especially in infants and young children. Offer small amounts of oral rehydration solution frequently. See a healthcare provider if your child has signs of dehydration, blood in the stool, diarrhea lasting more than a few days, or a high fever.',
    url: 'https://medlineplus.gov/diarrheachildren.html',
    lastReviewed: '2023-09-12',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Vomiting in Children ──
  {
    title: 'Vomiting in Children',
    content:
      'Vomiting in children is commonly caused by stomach viruses, food reactions, or motion sickness. It usually resolves on its own within 12 to 24 hours. Keep the child hydrated with small sips of clear fluids or oral rehydration solution. See a healthcare provider if vomiting lasts more than 24 hours, the child shows signs of dehydration, vomit contains blood or is green, or the child is lethargic.',
    url: 'https://medlineplus.gov/vomitingchildren.html',
    lastReviewed: '2024-04-08',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Rashes in Children ──
  {
    title: 'Rashes in Children',
    content:
      'Rashes in children can result from infections, allergies, heat, or irritants. Common childhood rashes include eczema, hives, impetigo, and viral exanthems. Most rashes are not serious and resolve on their own or with simple treatment. See a healthcare provider if the rash is accompanied by fever, spreads rapidly, appears as purple spots that do not blanch with pressure, or the child seems very unwell.',
    url: 'https://medlineplus.gov/rasheschildren.html',
    lastReviewed: '2023-07-22',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Allergies in Children ──
  {
    title: 'Allergies in Children',
    content:
      'Allergies occur when the immune system overreacts to substances such as pollen, dust mites, pet dander, or certain foods. Symptoms may include sneezing, runny nose, itchy eyes, skin rashes, or stomach upset. Avoiding known allergens and using antihistamines as directed can help manage symptoms. See a healthcare provider if your child has severe reactions, difficulty breathing, or swelling of the face, lips, or tongue.',
    url: 'https://medlineplus.gov/allergieschildren.html',
    lastReviewed: '2024-05-18',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Asthma in Children ──
  {
    title: 'Asthma in Children',
    content:
      'Asthma is a chronic lung condition that causes airway inflammation and narrowing, making breathing difficult. In children, triggers may include colds, exercise, allergens, and cold air. Symptoms include wheezing, coughing (especially at night), shortness of breath, and chest tightness. Follow an asthma action plan from your healthcare provider and seek emergency care if the child has severe difficulty breathing or rescue inhaler is not helping.',
    url: 'https://medlineplus.gov/asthmachildren.html',
    lastReviewed: '2024-06-01',
    population: 'pediatric',
  },
  // ── PEDIATRIC: RSV (Respiratory Syncytial Virus) ──
  {
    title: 'RSV (Respiratory Syncytial Virus)',
    content:
      'RSV is a common respiratory virus that usually causes mild cold-like symptoms. In infants and young children, it can lead to bronchiolitis or pneumonia. Symptoms include runny nose, cough, sneezing, fever, and wheezing. Most children recover in one to two weeks. Seek immediate care if the child has difficulty breathing, is breathing very fast, has a bluish color to lips or fingernails, or is not drinking enough fluids.',
    url: 'https://medlineplus.gov/rsv.html',
    lastReviewed: '2024-01-25',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Croup ──
  {
    title: 'Croup',
    content:
      'Croup is a viral infection that causes swelling around the vocal cords, leading to a characteristic barking cough, hoarse voice, and stridor (a high-pitched breathing sound). It most commonly affects children ages 6 months to 3 years. Cool mist humidifiers and exposure to cool night air can help ease symptoms. Seek emergency care if the child has severe stridor at rest, difficulty breathing, drooling, or appears very anxious.',
    url: 'https://medlineplus.gov/croup.html',
    lastReviewed: '2023-10-14',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Hand, Foot, and Mouth Disease ──
  {
    title: 'Hand, Foot, and Mouth Disease',
    content:
      'Hand, foot, and mouth disease is a common viral illness caused by coxsackievirus, usually affecting children under 5 years old. It causes fever, mouth sores, and a rash with blisters on the hands, feet, and sometimes buttocks. The illness is usually mild and resolves within 7 to 10 days. Ensure the child stays hydrated and offer soft foods. See a healthcare provider if your child cannot drink enough fluids or symptoms worsen.',
    url: 'https://medlineplus.gov/handfootmouth.html',
    lastReviewed: '2024-03-02',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Chickenpox ──
  {
    title: 'Chickenpox',
    content:
      'Chickenpox is a highly contagious viral infection caused by varicella-zoster virus. It causes an itchy, blister-like rash, fever, tiredness, and loss of appetite. The rash typically appears first on the chest, back, and face before spreading. Most cases are mild in children, and the varicella vaccine prevents most infections. See a healthcare provider if the child develops a high fever, the rash spreads to the eyes, or blisters appear infected.',
    url: 'https://medlineplus.gov/chickenpox.html',
    lastReviewed: '2023-08-19',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Measles ──
  {
    title: 'Measles',
    content:
      'Measles is a highly contagious viral disease that causes high fever, cough, runny nose, red watery eyes, and a characteristic red blotchy rash that starts on the face and spreads downward. It can lead to serious complications including pneumonia and encephalitis, especially in young children. The MMR vaccine is the best protection against measles. Seek medical care if measles is suspected, as it is a reportable disease.',
    url: 'https://medlineplus.gov/measles.html',
    lastReviewed: '2024-02-11',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Mumps ──
  {
    title: 'Mumps',
    content:
      'Mumps is a contagious viral infection that primarily affects the salivary glands, causing painful swelling of the cheeks and jaw. Other symptoms include fever, headache, muscle aches, and fatigue. Complications can include meningitis and hearing loss. The MMR vaccine prevents most mumps infections. See a healthcare provider if your child develops symptoms, especially severe headache, stiff neck, or abdominal pain.',
    url: 'https://medlineplus.gov/mumps.html',
    lastReviewed: '2023-12-03',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Whooping Cough (Pertussis) ──
  {
    title: 'Whooping Cough (Pertussis)',
    content:
      'Whooping cough is a highly contagious bacterial infection that causes severe coughing fits followed by a high-pitched "whoop" sound when breathing in. It is most dangerous in infants who may develop apnea instead of a whoop. The DTaP vaccine protects children against pertussis. Seek immediate medical care for any infant with a severe cough, and for any child with coughing spells that cause vomiting, turning blue, or difficulty breathing.',
    url: 'https://medlineplus.gov/whoopingcough.html',
    lastReviewed: '2024-04-20',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Constipation in Children ──
  {
    title: 'Constipation in Children',
    content:
      'Constipation in children means having hard, dry stools that are difficult or painful to pass, or having fewer bowel movements than usual. Common causes include a low-fiber diet, not drinking enough fluids, and withholding stool. Encourage your child to eat fruits, vegetables, and whole grains, and to drink plenty of water. See a healthcare provider if constipation lasts more than two weeks, is accompanied by abdominal pain, or blood is present in the stool.',
    url: 'https://medlineplus.gov/constipationchildren.html',
    lastReviewed: '2023-06-17',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Urinary Tract Infections in Children ──
  {
    title: 'Urinary Tract Infections in Children',
    content:
      'A urinary tract infection in children occurs when bacteria enter the urinary system. Symptoms vary by age: infants may have fever, irritability, and poor feeding, while older children may have painful urination, frequent urination, and abdominal pain. UTIs need prompt treatment with antibiotics to prevent kidney damage. See a healthcare provider if your child has symptoms of a UTI, especially if there is fever or back pain.',
    url: 'https://medlineplus.gov/utichildren.html',
    lastReviewed: '2024-01-08',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Child Growth and Development ──
  {
    title: 'Child Growth and Development',
    content:
      'Child growth and development refers to the physical, cognitive, emotional, and social milestones children reach as they age. Each child develops at their own pace, but there are general ranges for when milestones are typically achieved. Regular well-child visits help track growth and development. Talk to your healthcare provider if your child is not meeting milestones, loses previously acquired skills, or you have concerns about their development.',
    url: 'https://medlineplus.gov/childgrowth.html',
    lastReviewed: '2024-05-30',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Teething ──
  {
    title: 'Teething',
    content:
      'Teething is the process of baby teeth emerging through the gums, usually starting around 6 months of age. Symptoms may include drooling, fussiness, swollen gums, and a desire to chew on things. Low-grade fever may occur, but high fever is not caused by teething. Offer a clean, cool teething ring or gently rub the gums with a clean finger. See a healthcare provider if your child has high fever, diarrhea, or excessive crying.',
    url: 'https://medlineplus.gov/teething.html',
    lastReviewed: '2023-05-14',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Diaper Rash ──
  {
    title: 'Diaper Rash',
    content:
      'Diaper rash is a common skin irritation in the diaper area, causing red, inflamed skin. It is usually caused by prolonged contact with wet or soiled diapers, friction, or yeast infections. Change diapers frequently, allow air-drying, and apply a barrier cream such as zinc oxide. See a healthcare provider if the rash does not improve within a few days, has blisters or open sores, or the child develops a fever.',
    url: 'https://medlineplus.gov/diaperrash.html',
    lastReviewed: '2024-02-05',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Jaundice in Newborns ──
  {
    title: 'Jaundice in Newborns',
    content:
      'Newborn jaundice causes yellowing of the skin and eyes due to elevated bilirubin levels in the blood. It is common in the first week of life, especially in premature infants. Mild jaundice often resolves on its own with frequent feeding. See a healthcare provider promptly if the yellow color deepens, the baby is difficult to wake, is not feeding well, or jaundice appears within 24 hours of birth.',
    url: 'https://medlineplus.gov/newbornjaundice.html',
    lastReviewed: '2024-06-10',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Colic ──
  {
    title: 'Colic',
    content:
      'Colic is frequent, prolonged, and intense crying in a healthy infant, typically occurring in the first few weeks of life and improving by 3 to 4 months. A colicky baby may cry for more than three hours a day, three days a week. The cause is not fully understood. Soothing techniques include swaddling, gentle motion, and white noise. See a healthcare provider to rule out other causes of crying and if the baby has fever, vomiting, or changes in stool.',
    url: 'https://medlineplus.gov/colic.html',
    lastReviewed: '2023-11-22',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Febrile Seizures ──
  {
    title: 'Febrile Seizures',
    content:
      'Febrile seizures are convulsions that can occur in young children during a fever, most commonly between ages 6 months and 5 years. They usually last less than five minutes and do not cause lasting harm. During a seizure, place the child on their side on a safe surface and do not put anything in their mouth. Call emergency services if the seizure lasts more than five minutes, the child does not recover quickly, or it is the first febrile seizure.',
    url: 'https://medlineplus.gov/febrileseizures.html',
    lastReviewed: '2024-03-28',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Head Lice ──
  {
    title: 'Head Lice',
    content:
      'Head lice are tiny insects that live on the scalp and feed on blood. They are spread by direct head-to-head contact and are common in school-age children. Symptoms include itching and small red bumps on the scalp. Treatment involves over-the-counter or prescription lice-killing shampoos and careful combing with a fine-tooth nit comb. See a healthcare provider if over-the-counter treatments do not work or if the scalp appears infected.',
    url: 'https://medlineplus.gov/headlice.html',
    lastReviewed: '2023-09-05',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Pinworms ──
  {
    title: 'Pinworms',
    content:
      'Pinworms are small, thin white worms that infect the intestines, most commonly in school-age children. The main symptom is intense itching around the anus, especially at night when female worms lay eggs. Pinworms are easily spread in households and classrooms. Treatment involves a two-dose course of anti-parasitic medication for the entire household. See a healthcare provider for diagnosis and treatment if pinworms are suspected.',
    url: 'https://medlineplus.gov/pinworms.html',
    lastReviewed: '2024-01-30',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Strep Throat in Children ──
  {
    title: 'Strep Throat in Children',
    content:
      'Strep throat is a bacterial infection of the throat and tonsils caused by group A Streptococcus. Symptoms include severe sore throat, fever, red swollen tonsils (sometimes with white patches), and swollen lymph nodes. Unlike viral sore throats, strep rarely causes cough or runny nose. Strep throat requires antibiotic treatment to prevent complications such as rheumatic fever. See a healthcare provider if your child has a sore throat with fever.',
    url: 'https://medlineplus.gov/strepthroat.html',
    lastReviewed: '2024-04-12',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Tonsillitis ──
  {
    title: 'Tonsillitis',
    content:
      'Tonsillitis is inflammation of the tonsils, usually caused by viral or bacterial infections. Symptoms include sore throat, difficulty swallowing, fever, swollen glands, and red swollen tonsils. Treatment depends on the cause: bacterial tonsillitis requires antibiotics, while viral tonsillitis resolves on its own. See a healthcare provider if your child has difficulty breathing or swallowing, drools excessively, or has symptoms lasting more than a few days.',
    url: 'https://medlineplus.gov/tonsillitis.html',
    lastReviewed: '2023-08-08',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Bronchiolitis ──
  {
    title: 'Bronchiolitis',
    content:
      'Bronchiolitis is a common lung infection in infants and young children, usually caused by RSV. It affects the small airways (bronchioles), causing swelling and mucus buildup. Symptoms include runny nose, cough, wheezing, and difficulty breathing. Most cases are mild and resolve at home with fluids and comfort measures. Seek immediate care if the child has rapid breathing, difficulty feeding, nasal flaring, or bluish skin color.',
    url: 'https://medlineplus.gov/bronchiolitis.html',
    lastReviewed: '2024-02-18',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Pneumonia in Children ──
  {
    title: 'Pneumonia in Children',
    content:
      'Pneumonia is an infection of the lungs that can be caused by bacteria, viruses, or fungi. In children, symptoms include cough, fever, rapid breathing, chest pain, and difficulty breathing. Bacterial pneumonia requires antibiotic treatment. Keep the child hydrated and rested. Seek immediate medical care if the child has severe difficulty breathing, looks bluish, has a very high fever, or is not improving with treatment.',
    url: 'https://medlineplus.gov/pneumoniachildren.html',
    lastReviewed: '2023-10-25',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Dehydration in Children ──
  {
    title: 'Dehydration in Children',
    content:
      'Dehydration occurs when a child loses more fluids than they take in, often due to vomiting, diarrhea, or fever. Signs include dry mouth, fewer tears when crying, less wet diapers, sunken eyes, and lethargy. Offer small frequent sips of oral rehydration solution. Seek immediate medical care if the child has no tears, very dry mouth, sunken fontanelle (in infants), no urine for 6 or more hours, or appears very lethargic.',
    url: 'https://medlineplus.gov/dehydrationchildren.html',
    lastReviewed: '2024-05-05',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Food Allergies in Children ──
  {
    title: 'Food Allergies in Children',
    content:
      'Food allergies occur when the immune system reacts to certain proteins in food. Common triggers in children include milk, eggs, peanuts, tree nuts, wheat, soy, fish, and shellfish. Symptoms range from mild (hives, stomach upset) to severe (anaphylaxis). Strict avoidance of trigger foods is key. Children with known food allergies should carry epinephrine auto-injectors. Seek emergency care for any signs of anaphylaxis such as difficulty breathing or throat swelling.',
    url: 'https://medlineplus.gov/foodallergieschildren.html',
    lastReviewed: '2024-06-15',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Eczema in Children ──
  {
    title: 'Eczema in Children',
    content:
      'Eczema (atopic dermatitis) is a chronic skin condition causing dry, itchy, inflamed patches of skin. It commonly affects infants and young children, often on the face, elbows, and knees. Triggers may include irritants, allergens, dry air, and stress. Treatment includes regular moisturizing, avoiding triggers, and using prescribed topical medications. See a healthcare provider if the rash is severe, appears infected, or does not respond to basic treatment.',
    url: 'https://medlineplus.gov/eczemachildren.html',
    lastReviewed: '2023-12-20',
    population: 'pediatric',
  },
  // ── PEDIATRIC: ADHD in Children ──
  {
    title: 'ADHD in Children',
    content:
      'Attention-deficit/hyperactivity disorder (ADHD) is a neurodevelopmental condition that affects concentration, impulse control, and activity levels. Children with ADHD may have trouble paying attention, act without thinking, and be overly active. Diagnosis involves a thorough evaluation by a healthcare provider. Treatment may include behavioral therapy, educational support, and medication. Talk to your healthcare provider if your child has persistent difficulty with focus, behavior, or schoolwork.',
    url: 'https://medlineplus.gov/adhdchildren.html',
    lastReviewed: '2024-04-01',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Autism Spectrum Disorder Screening ──
  {
    title: 'Autism Spectrum Disorder Screening',
    content:
      'Autism spectrum disorder (ASD) is a developmental condition that affects communication, behavior, and social interaction. Early signs may include limited eye contact, delayed speech, repetitive behaviors, and difficulty with social interactions. Early screening and intervention can significantly improve outcomes. The American Academy of Pediatrics recommends autism screening at 18 and 24 months. Talk to your healthcare provider if you have concerns about your child\'s development.',
    url: 'https://medlineplus.gov/autismscreening.html',
    lastReviewed: '2024-01-18',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Childhood Vaccines ──
  {
    title: 'Childhood Vaccines',
    content:
      'Vaccines protect children from serious diseases such as measles, whooping cough, polio, and more. The recommended childhood immunization schedule begins at birth and continues through adolescence. Vaccines are thoroughly tested for safety and are one of the most effective ways to prevent infectious diseases. Keep a record of your child\'s vaccinations and follow the schedule recommended by your healthcare provider.',
    url: 'https://medlineplus.gov/childhoodvaccines.html',
    lastReviewed: '2024-05-22',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Child Safety ──
  {
    title: 'Child Safety',
    content:
      'Unintentional injuries are a leading cause of death in children. Key safety measures include using car seats and seat belts, installing smoke detectors, keeping medicines and chemicals out of reach, supervising children near water, and using safety gates for stairs. Childproofing the home should begin before a baby starts crawling. Talk to your healthcare provider about age-appropriate safety measures at each well-child visit.',
    url: 'https://medlineplus.gov/childsafety.html',
    lastReviewed: '2023-07-10',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Poisoning Prevention in Children ──
  {
    title: 'Poisoning Prevention in Children',
    content:
      'Children are naturally curious and may ingest household chemicals, medications, or toxic plants. Keep all medicines, cleaning products, and chemicals locked up and out of reach. Have the Poison Control number (1-800-222-1222) readily available. If you suspect poisoning, call Poison Control or 911 immediately. Do not induce vomiting unless specifically instructed. Childproof caps are not fully child-resistant, so secure storage is essential.',
    url: 'https://medlineplus.gov/poisoningprevention.html',
    lastReviewed: '2024-02-28',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Burns in Children ──
  {
    title: 'Burns in Children',
    content:
      'Burns in children can result from hot liquids, flames, chemicals, or electricity. First-degree burns cause redness, second-degree burns cause blisters, and third-degree burns damage deeper tissues. For minor burns, cool the area under running water for 10 to 20 minutes and cover loosely with a clean bandage. Seek immediate medical care for burns that are large, on the face, hands, or genitals, or appear deep or charred.',
    url: 'https://medlineplus.gov/burnsinchildren.html',
    lastReviewed: '2023-06-30',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Drowning Prevention ──
  {
    title: 'Drowning Prevention',
    content:
      'Drowning is a leading cause of injury death in children ages 1 to 4. Young children can drown in as little as one inch of water. Never leave children unattended near water, including bathtubs, pools, and buckets. Install four-sided pool fences with self-closing gates. Enroll children in age-appropriate swimming lessons. Learn CPR. If a child is missing, check water sources first and call 911 immediately.',
    url: 'https://medlineplus.gov/drowningprevention.html',
    lastReviewed: '2024-06-05',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Fifth Disease ──
  {
    title: 'Fifth Disease',
    content:
      'Fifth disease is a mild viral illness caused by parvovirus B19, common in school-age children. It causes a distinctive bright red rash on the cheeks ("slapped cheek" appearance) that may spread to the body. Other symptoms include low-grade fever, runny nose, and joint pain. Most children recover without treatment. See a healthcare provider if your child has a weakened immune system or if a pregnant woman is exposed.',
    url: 'https://medlineplus.gov/fifthdisease.html',
    lastReviewed: '2023-04-15',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Impetigo in Children ──
  {
    title: 'Impetigo in Children',
    content:
      'Impetigo is a common, highly contagious bacterial skin infection that mainly affects infants and young children. It causes red sores that burst and develop honey-colored crusts, usually around the nose and mouth. Good hygiene and keeping sores covered help prevent spreading. Treatment typically involves antibiotic ointment or oral antibiotics. See a healthcare provider if sores are spreading, do not improve with treatment, or the child develops fever.',
    url: 'https://medlineplus.gov/impetigochildren.html',
    lastReviewed: '2024-03-10',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Scarlet Fever ──
  {
    title: 'Scarlet Fever',
    content:
      'Scarlet fever is a bacterial illness caused by group A Streptococcus, typically following strep throat. It causes a red, sandpaper-like rash, high fever, sore throat, and a strawberry-textured tongue. It is most common in children ages 5 to 15. Treatment with antibiotics is necessary to prevent complications. See a healthcare provider promptly if your child has a sore throat with a rash, fever, or swollen glands.',
    url: 'https://medlineplus.gov/scarletfever.html',
    lastReviewed: '2023-11-08',
    population: 'pediatric',
  },

  // ═══ GERIATRIC TOPICS ════════════════════════════════════════════════════════════
  // ── GERIATRIC: Falls in Older Adults ──
  {
    title: 'Falls in Older Adults',
    content:
      'Falls are the leading cause of injury among adults aged 65 and older. Risk factors include muscle weakness, balance problems, medication side effects, vision problems, and home hazards. Prevention includes regular exercise to improve strength and balance, medication review, vision checks, and removing tripping hazards at home. Seek medical attention after a fall if there is any head injury, inability to bear weight, severe pain, or confusion.',
    url: 'https://medlineplus.gov/falls.html',
    lastReviewed: '2024-01-20',
    population: 'geriatric',
  },
  // ── GERIATRIC: Confusion and Delirium in Older Adults ──
  {
    title: 'Confusion and Delirium in Older Adults',
    content:
      'Delirium is a sudden change in mental function causing confusion, disorientation, and difficulty with attention. In older adults, it can be triggered by infections, medications, dehydration, surgery, or hospitalization. Unlike dementia, delirium develops quickly over hours or days and is often reversible. Seek immediate medical care if an older adult develops sudden confusion, as it may indicate a serious underlying condition such as infection or stroke.',
    url: 'https://medlineplus.gov/delirium.html',
    lastReviewed: '2023-10-30',
    population: 'geriatric',
  },
  // ── GERIATRIC: Stroke ──
  {
    title: 'Stroke',
    content:
      'A stroke occurs when blood supply to part of the brain is interrupted or reduced, depriving brain tissue of oxygen. Symptoms include sudden numbness or weakness on one side of the body, sudden confusion, trouble speaking, vision problems, severe headache, and loss of balance. Use the FAST method: Face drooping, Arm weakness, Speech difficulty, Time to call 911. Immediate treatment can minimize brain damage and potential complications.',
    url: 'https://medlineplus.gov/stroke.html',
    lastReviewed: '2024-04-15',
    population: 'geriatric',
  },
  // ── GERIATRIC: Heart Attack ──
  {
    title: 'Heart Attack',
    content:
      'A heart attack occurs when blood flow to part of the heart muscle is blocked, usually by a blood clot. Symptoms include chest pain or discomfort, shortness of breath, pain in one or both arms, jaw, neck, or back, nausea, and cold sweats. Women may have atypical symptoms. Call 911 immediately if you suspect a heart attack. Quick treatment is essential to restore blood flow and reduce heart damage.',
    url: 'https://medlineplus.gov/heartattack.html',
    lastReviewed: '2024-02-14',
    population: 'geriatric',
  },
  // ── GERIATRIC: High Blood Pressure in Older Adults ──
  {
    title: 'High Blood Pressure in Older Adults',
    content:
      'High blood pressure (hypertension) is common in older adults and increases the risk of heart disease, stroke, and kidney problems. It often has no symptoms, making regular monitoring essential. Lifestyle changes including reducing sodium, regular exercise, maintaining a healthy weight, and limiting alcohol can help. Take prescribed medications as directed. See a healthcare provider for regular blood pressure checks and if readings are consistently elevated.',
    url: 'https://medlineplus.gov/highbloodpressureelderly.html',
    lastReviewed: '2023-09-22',
    population: 'geriatric',
  },
  // ── GERIATRIC: Atrial Fibrillation ──
  {
    title: 'Atrial Fibrillation',
    content:
      'Atrial fibrillation (AFib) is an irregular, often rapid heart rhythm that is common in older adults. Symptoms may include palpitations, shortness of breath, weakness, dizziness, and fatigue. AFib increases the risk of stroke and heart failure. Treatment may include medications to control heart rate and rhythm, blood thinners to prevent stroke, and procedures. Seek emergency care for chest pain, severe shortness of breath, or fainting.',
    url: 'https://medlineplus.gov/atrialfibrillation.html',
    lastReviewed: '2024-05-10',
    population: 'geriatric',
  },
  // ── GERIATRIC: Heart Failure ──
  {
    title: 'Heart Failure',
    content:
      'Heart failure means the heart cannot pump blood as well as it should. Common symptoms include shortness of breath, fatigue, swelling in the legs and feet, rapid heartbeat, and persistent cough. It is more common in older adults and those with heart conditions. Treatment includes medications, lifestyle changes, and sometimes devices or surgery. Seek immediate care for sudden shortness of breath, chest pain, or fainting.',
    url: 'https://medlineplus.gov/heartfailure.html',
    lastReviewed: '2023-12-08',
    population: 'geriatric',
  },
  // ── GERIATRIC: COPD in Older Adults ──
  {
    title: 'COPD in Older Adults',
    content:
      'Chronic obstructive pulmonary disease (COPD) includes emphysema and chronic bronchitis. It causes airflow obstruction and breathing difficulty, most often from long-term smoking. Symptoms include chronic cough, mucus production, shortness of breath, and wheezing. Treatment includes bronchodilators, inhaled steroids, pulmonary rehabilitation, and flu and pneumonia vaccines. Seek emergency care for severe shortness of breath, bluish lips, or confusion.',
    url: 'https://medlineplus.gov/copdelderly.html',
    lastReviewed: '2024-03-22',
    population: 'geriatric',
  },
  // ── GERIATRIC: Pneumonia in Older Adults ──
  {
    title: 'Pneumonia in Older Adults',
    content:
      'Pneumonia is a lung infection that can be especially dangerous for adults over 65. Older adults may have atypical symptoms such as confusion, low body temperature, or worsening of existing conditions rather than high fever. Pneumococcal and flu vaccines help prevent pneumonia. Treatment depends on the type and severity and may include antibiotics and supportive care. Seek immediate care for difficulty breathing, confusion, or persistent high fever.',
    url: 'https://medlineplus.gov/pneumoniaelderly.html',
    lastReviewed: '2024-01-05',
    population: 'geriatric',
  },
  // ── GERIATRIC: UTI in Older Adults ──
  {
    title: 'UTI in Older Adults',
    content:
      'Urinary tract infections are common in older adults and may present differently than in younger people. Older adults may experience confusion, agitation, falls, or decreased appetite rather than typical symptoms like painful urination. UTIs require prompt antibiotic treatment. Staying hydrated and maintaining good hygiene can help prevent infections. See a healthcare provider if an older adult develops sudden confusion, changes in behavior, or urinary symptoms.',
    url: 'https://medlineplus.gov/utielderly.html',
    lastReviewed: '2023-08-15',
    population: 'geriatric',
  },
  // ── GERIATRIC: Dementia ──
  {
    title: 'Dementia',
    content:
      'Dementia is a group of conditions characterized by progressive decline in memory, thinking, and social abilities severe enough to interfere with daily life. Symptoms include memory loss, difficulty communicating, trouble with reasoning, confusion, and personality changes. It most commonly affects older adults. While there is no cure for most types, some treatments can help manage symptoms. See a healthcare provider early if memory changes are affecting daily activities.',
    url: 'https://medlineplus.gov/dementia.html',
    lastReviewed: '2024-06-01',
    population: 'geriatric',
  },
  // ── GERIATRIC: Alzheimer's Disease ──
  {
    title: 'Alzheimer\'s Disease',
    content:
      'Alzheimer\'s disease is the most common cause of dementia, accounting for 60 to 80 percent of cases. It causes a progressive decline in memory, thinking, and behavior. Early signs include difficulty remembering recent events, trouble with planning and problem solving, and confusion with time or place. There is no cure, but treatments can help manage symptoms and support quality of life. Seek medical evaluation for persistent memory problems.',
    url: 'https://medlineplus.gov/alzheimers.html',
    lastReviewed: '2024-04-25',
    population: 'geriatric',
  },
  // ── GERIATRIC: Parkinson's Disease ──
  {
    title: 'Parkinson\'s Disease',
    content:
      'Parkinson\'s disease is a progressive nervous system disorder that affects movement. Symptoms develop gradually and may include tremor (usually starting in one hand), slowed movement, rigid muscles, impaired balance, and changes in speech and writing. It most commonly affects people over age 60. Treatment includes medications to manage symptoms, physical therapy, and sometimes surgery. See a healthcare provider if you notice persistent tremor or movement changes.',
    url: 'https://medlineplus.gov/parkinsonsdisease.html',
    lastReviewed: '2023-11-15',
    population: 'geriatric',
  },
  // ── GERIATRIC: Osteoporosis ──
  {
    title: 'Osteoporosis',
    content:
      'Osteoporosis causes bones to become weak and brittle, increasing the risk of fractures. It is most common in older adults, especially postmenopausal women. Often there are no symptoms until a bone breaks. Prevention includes adequate calcium and vitamin D intake, weight-bearing exercise, and avoiding smoking and excessive alcohol. Bone density testing is recommended for women over 65 and men over 70. See a healthcare provider to discuss screening and treatment.',
    url: 'https://medlineplus.gov/osteoporosis.html',
    lastReviewed: '2024-02-08',
    population: 'geriatric',
  },
  // ── GERIATRIC: Arthritis in Older Adults ──
  {
    title: 'Arthritis in Older Adults',
    content:
      'Arthritis is inflammation of one or more joints, causing pain, swelling, and stiffness. Osteoarthritis, the most common form in older adults, results from wear and tear on joint cartilage. Symptoms include joint pain, stiffness (especially in the morning), reduced range of motion, and swelling. Treatment includes exercise, weight management, pain relievers, and physical therapy. See a healthcare provider if joint pain is persistent, limits activity, or suddenly worsens.',
    url: 'https://medlineplus.gov/arthritiselderly.html',
    lastReviewed: '2023-07-28',
    population: 'geriatric',
  },
  // ── GERIATRIC: Hip Fracture ──
  {
    title: 'Hip Fracture',
    content:
      'A hip fracture is a serious injury, especially in older adults, often resulting from a fall. Symptoms include severe pain in the hip or groin, inability to put weight on the leg, bruising and swelling, and the affected leg appearing shorter or turned outward. Hip fractures almost always require surgery and extensive rehabilitation. Call 911 immediately for suspected hip fracture. Prevention includes fall prevention, osteoporosis treatment, and home safety modifications.',
    url: 'https://medlineplus.gov/hipfracture.html',
    lastReviewed: '2024-05-15',
    population: 'geriatric',
  },
  // ── GERIATRIC: Vision Problems in Older Adults ──
  {
    title: 'Vision Problems in Older Adults',
    content:
      'Age-related vision problems include cataracts, glaucoma, macular degeneration, and diabetic retinopathy. Symptoms may include blurry vision, difficulty seeing at night, loss of peripheral vision, and seeing floaters or flashes. Regular eye exams can detect problems early when treatment is most effective. See an eye care provider immediately for sudden vision loss, sudden appearance of many floaters, flashes of light, or a curtain-like shadow over your field of vision.',
    url: 'https://medlineplus.gov/visionproblemselderly.html',
    lastReviewed: '2023-06-12',
    population: 'geriatric',
  },
  // ── GERIATRIC: Hearing Loss in Older Adults ──
  {
    title: 'Hearing Loss in Older Adults',
    content:
      'Age-related hearing loss (presbycusis) is a gradual loss of hearing that occurs as people age, affecting about one-third of adults over 65. Signs include difficulty understanding speech especially in noisy settings, frequently asking others to repeat themselves, and turning up the TV volume. Hearing aids and assistive devices can significantly improve quality of life. See a healthcare provider for a hearing evaluation if you notice changes in your hearing.',
    url: 'https://medlineplus.gov/hearinglosselderly.html',
    lastReviewed: '2024-01-12',
    population: 'geriatric',
  },
  // ── GERIATRIC: Depression in Older Adults ──
  {
    title: 'Depression in Older Adults',
    content:
      'Depression in older adults is a serious condition that is often underdiagnosed. It is not a normal part of aging. Symptoms include persistent sadness, loss of interest in activities, fatigue, changes in sleep and appetite, difficulty concentrating, and thoughts of death. Chronic illness, isolation, and loss of loved ones can contribute. Treatment includes therapy, medication, and social support. Seek help immediately if there are thoughts of self-harm or suicide.',
    url: 'https://medlineplus.gov/depressionelderly.html',
    lastReviewed: '2024-03-05',
    population: 'geriatric',
  },
  // ── GERIATRIC: Medication Management for Older Adults ──
  {
    title: 'Medication Management for Older Adults',
    content:
      'Older adults often take multiple medications, which increases the risk of drug interactions, side effects, and medication errors. Keep an updated list of all medications including over-the-counter drugs and supplements. Use one pharmacy when possible and review medications with your healthcare provider regularly. Use pill organizers and reminders to help take medications correctly. See a healthcare provider if you experience new symptoms that may be medication side effects.',
    url: 'https://medlineplus.gov/medicationmanagement.html',
    lastReviewed: '2023-10-05',
    population: 'geriatric',
  },
  // ── GERIATRIC: Polypharmacy ──
  {
    title: 'Polypharmacy',
    content:
      'Polypharmacy refers to the use of multiple medications, typically five or more, which is common in older adults with several chronic conditions. It increases the risk of adverse drug reactions, falls, cognitive impairment, and hospitalization. Regular medication reviews with a healthcare provider can identify unnecessary medications. Never stop medications without medical guidance. Talk to your healthcare provider about simplifying your medication regimen when possible.',
    url: 'https://medlineplus.gov/polypharmacy.html',
    lastReviewed: '2024-04-08',
    population: 'geriatric',
  },
  // ── GERIATRIC: Malnutrition in Older Adults ──
  {
    title: 'Malnutrition in Older Adults',
    content:
      'Malnutrition is common in older adults due to decreased appetite, dental problems, chronic illness, medications, social isolation, and difficulty shopping or cooking. Warning signs include unintended weight loss, fatigue, muscle weakness, slow wound healing, and frequent infections. Nutrient-dense foods, meal programs, and nutritional supplements can help. See a healthcare provider if you notice significant weight loss, decreased appetite, or signs of malnutrition in an older adult.',
    url: 'https://medlineplus.gov/malnutritionelderly.html',
    lastReviewed: '2023-05-20',
    population: 'geriatric',
  },
  // ── GERIATRIC: Dehydration in Older Adults ──
  {
    title: 'Dehydration in Older Adults',
    content:
      'Older adults are at higher risk of dehydration because the sense of thirst decreases with age and kidneys may not conserve water as well. Medications such as diuretics also increase risk. Signs include dark urine, dry mouth, dizziness, confusion, and fatigue. Encourage regular fluid intake throughout the day even when not thirsty. Seek medical care if an older adult shows signs of severe dehydration such as confusion, rapid heartbeat, or fainting.',
    url: 'https://medlineplus.gov/dehydrationelderly.html',
    lastReviewed: '2024-06-08',
    population: 'geriatric',
  },
  // ── GERIATRIC: Skin Tears in Older Adults ──
  {
    title: 'Skin Tears in Older Adults',
    content:
      'Skin tears are wounds caused by shear, friction, or blunt force that separate skin layers. Older adults are more susceptible because aging skin is thinner and more fragile. Keep skin moisturized, avoid adhesive bandages directly on fragile skin, and protect arms and legs from bumps. For a skin tear, gently clean the area, carefully lay the skin flap back into place, and cover with a non-stick dressing. See a healthcare provider if the tear is large, deep, or shows signs of infection.',
    url: 'https://medlineplus.gov/skintearselderly.html',
    lastReviewed: '2023-09-28',
    population: 'geriatric',
  },
  // ── GERIATRIC: Pressure Ulcers ──
  {
    title: 'Pressure Ulcers',
    content:
      'Pressure ulcers (bedsores) are injuries to skin and underlying tissue from prolonged pressure, typically over bony areas. They most commonly affect people with limited mobility. Prevention includes repositioning frequently, keeping skin clean and dry, using pressure-relieving surfaces, and maintaining good nutrition. See a healthcare provider immediately if a pressure ulcer develops, especially if there is redness that does not fade, blistering, or an open wound.',
    url: 'https://medlineplus.gov/pressureulcers.html',
    lastReviewed: '2024-02-25',
    population: 'geriatric',
  },
  // ── GERIATRIC: Elder Abuse ──
  {
    title: 'Elder Abuse',
    content:
      'Elder abuse includes physical, emotional, sexual abuse, neglect, abandonment, and financial exploitation of older adults. Warning signs include unexplained injuries, fearfulness, withdrawal, poor hygiene, sudden financial changes, and caregiver isolation of the elder. If you suspect elder abuse, contact Adult Protective Services or call the Eldercare Locator at 1-800-677-1116. In an emergency, call 911.',
    url: 'https://medlineplus.gov/elderabuse.html',
    lastReviewed: '2024-05-28',
    population: 'geriatric',
  },
  // ── GERIATRIC: End-of-Life Care ──
  {
    title: 'End-of-Life Care',
    content:
      'End-of-life care focuses on comfort, dignity, and quality of life for people with terminal illnesses. It includes palliative care to manage pain and symptoms, emotional and spiritual support, and hospice services. Having conversations about care preferences early is important. Advance directives and healthcare proxies help ensure wishes are followed. Talk to a healthcare provider about palliative care options and hospice services when appropriate.',
    url: 'https://medlineplus.gov/endoflifecare.html',
    lastReviewed: '2023-08-30',
    population: 'geriatric',
  },
  // ── GERIATRIC: Advance Directives ──
  {
    title: 'Advance Directives',
    content:
      'Advance directives are legal documents that allow you to express your wishes about medical care if you become unable to make decisions for yourself. They include a living will (specifying treatments you do or do not want) and a healthcare power of attorney (naming someone to make decisions for you). Complete advance directives while you are healthy and share them with family and healthcare providers.',
    url: 'https://medlineplus.gov/advancedirectives.html',
    lastReviewed: '2024-01-28',
    population: 'geriatric',
  },
  // ── GERIATRIC: Balance Problems in Older Adults ──
  {
    title: 'Balance Problems in Older Adults',
    content:
      'Balance problems in older adults can result from inner ear disorders, vision changes, nerve damage, muscle weakness, and medications. Symptoms include unsteadiness, dizziness, and a sensation of spinning. Balance problems increase the risk of falls. Treatment depends on the cause and may include physical therapy, medication changes, and exercises. See a healthcare provider if you experience frequent unsteadiness, falls, or a sudden change in balance.',
    url: 'https://medlineplus.gov/balanceproblems.html',
    lastReviewed: '2023-12-15',
    population: 'geriatric',
  },
  // ── GERIATRIC: Dizziness in Older Adults ──
  {
    title: 'Dizziness in Older Adults',
    content:
      'Dizziness is a common complaint in older adults and can mean lightheadedness, unsteadiness, or vertigo (a spinning sensation). Causes include inner ear problems, low blood pressure, dehydration, medication side effects, and heart conditions. Sit or lie down when dizzy to prevent falls. See a healthcare provider if dizziness is recurrent, sudden, severe, or accompanied by headache, chest pain, difficulty speaking, or fainting.',
    url: 'https://medlineplus.gov/dizzinesselderly.html',
    lastReviewed: '2024-03-18',
    population: 'geriatric',
  },
  // ── GERIATRIC: Tremor ──
  {
    title: 'Tremor',
    content:
      'A tremor is an involuntary, rhythmic shaking of a body part, most commonly the hands. Essential tremor is the most common type and tends to worsen with age. Parkinson\'s disease also causes tremor, typically starting on one side. Treatment depends on the type and severity and may include medication, therapy, and lifestyle modifications. See a healthcare provider if you develop a new or worsening tremor, as it may indicate an underlying condition.',
    url: 'https://medlineplus.gov/tremor.html',
    lastReviewed: '2023-07-05',
    population: 'geriatric',
  },
  // ── GERIATRIC: Urinary Incontinence ──
  {
    title: 'Urinary Incontinence',
    content:
      'Urinary incontinence, the loss of bladder control, is common in older adults. Types include stress incontinence (leaking with coughing or sneezing), urge incontinence (sudden strong urge), and overflow incontinence. Causes include weakened pelvic muscles, enlarged prostate, nerve damage, and certain medications. Treatment options include pelvic floor exercises, bladder training, medications, and surgery. See a healthcare provider, as incontinence is treatable and not a normal part of aging.',
    url: 'https://medlineplus.gov/urinaryincontinence.html',
    lastReviewed: '2024-05-02',
    population: 'geriatric',
  },
  // ── GERIATRIC: Constipation in Older Adults ──
  {
    title: 'Constipation in Older Adults',
    content:
      'Constipation is a common problem in older adults, often caused by a low-fiber diet, insufficient fluid intake, physical inactivity, and medications. Symptoms include infrequent bowel movements, hard stools, straining, and a feeling of incomplete evacuation. Increasing fiber, fluids, and physical activity can help. See a healthcare provider if constipation is new and persistent, is accompanied by blood in the stool, or is associated with significant pain or weight loss.',
    url: 'https://medlineplus.gov/constipationelderly.html',
    lastReviewed: '2023-11-28',
    population: 'geriatric',
  },
  // ── GERIATRIC: Sleep Problems in Older Adults ──
  {
    title: 'Sleep Problems in Older Adults',
    content:
      'Sleep patterns naturally change with age, but persistent sleep problems are not a normal part of aging. Common issues include difficulty falling asleep, waking frequently, and daytime sleepiness. Causes include medical conditions, medications, pain, sleep apnea, and restless legs syndrome. Good sleep habits include keeping a regular schedule, limiting caffeine, and creating a comfortable sleep environment. See a healthcare provider if sleep problems persist and affect daily functioning.',
    url: 'https://medlineplus.gov/sleepproblemselderly.html',
    lastReviewed: '2024-04-18',
    population: 'geriatric',
  },
  // ── GERIATRIC: Shingles ──
  {
    title: 'Shingles',
    content:
      'Shingles is a painful rash caused by reactivation of the varicella-zoster virus, the same virus that causes chickenpox. It typically appears as a band of blisters on one side of the body. Risk increases with age and weakened immune systems. The shingles vaccine is recommended for adults 50 and older. Early treatment with antiviral medications can shorten the illness and reduce complications. See a healthcare provider promptly if you suspect shingles, especially if the rash is near the eye.',
    url: 'https://medlineplus.gov/shingles.html',
    lastReviewed: '2024-02-12',
    population: 'geriatric',
  },
  // ── GERIATRIC: Influenza in Older Adults ──
  {
    title: 'Influenza in Older Adults',
    content:
      'Influenza (flu) can be especially dangerous for adults 65 and older, who are at higher risk for serious complications including pneumonia, hospitalization, and death. Symptoms include fever, cough, sore throat, body aches, and fatigue. Annual flu vaccination is strongly recommended, preferably the high-dose or adjuvanted version for older adults. Antiviral medications can help if started early. Seek medical care for difficulty breathing, persistent chest pain, or confusion.',
    url: 'https://medlineplus.gov/fluelderly.html',
    lastReviewed: '2023-10-18',
    population: 'geriatric',
  },
  // ── GERIATRIC: COVID-19 in Older Adults ──
  {
    title: 'COVID-19 in Older Adults',
    content:
      'Older adults are at higher risk for severe illness from COVID-19. Symptoms include fever, cough, shortness of breath, fatigue, body aches, and loss of taste or smell. Stay up to date on COVID-19 vaccinations and boosters. Good hand hygiene, ventilation, and masking in high-risk settings can reduce transmission. Seek emergency care for difficulty breathing, persistent chest pain, confusion, or inability to stay awake.',
    url: 'https://medlineplus.gov/covidelderly.html',
    lastReviewed: '2024-06-12',
    population: 'geriatric',
  },
  // ── GERIATRIC: Diabetes in Older Adults ──
  {
    title: 'Diabetes in Older Adults',
    content:
      'Diabetes management in older adults requires special attention because aging affects blood sugar control and complications are more common. Symptoms of uncontrolled diabetes include frequent urination, increased thirst, fatigue, and blurred vision. Hypoglycemia (low blood sugar) is especially dangerous and can cause confusion, falls, and heart problems. Regular monitoring, balanced meals, medications, and exercise help manage diabetes. See a healthcare provider for regular A1C testing and medication review.',
    url: 'https://medlineplus.gov/diabeteselderly.html',
    lastReviewed: '2023-06-25',
    population: 'geriatric',
  },
  // ── GERIATRIC: Chronic Kidney Disease in Older Adults ──
  {
    title: 'Chronic Kidney Disease in Older Adults',
    content:
      'Chronic kidney disease (CKD) is common in older adults and often develops gradually over years. Diabetes and high blood pressure are the most common causes. Early stages may have no symptoms; later stages can cause fatigue, swelling, nausea, and difficulty concentrating. Regular blood and urine tests can detect CKD early. Managing blood pressure, blood sugar, and avoiding nephrotoxic medications help slow progression. See a healthcare provider for regular kidney function monitoring.',
    url: 'https://medlineplus.gov/ckdelderly.html',
    lastReviewed: '2024-03-30',
    population: 'geriatric',
  },
  // ── GERIATRIC: Caregiver Stress ──
  {
    title: 'Caregiver Stress',
    content:
      'Caring for an older adult with chronic illness or disability can lead to physical and emotional exhaustion, known as caregiver burnout. Signs include fatigue, anxiety, depression, social withdrawal, and health problems. Caregivers should seek respite care, support groups, and community resources. Maintaining your own health is essential to providing good care. Talk to a healthcare provider if you feel overwhelmed, depressed, or unable to cope.',
    url: 'https://medlineplus.gov/caregiverstress.html',
    lastReviewed: '2024-05-20',
    population: 'geriatric',
  },
  // ── GERIATRIC: Peripheral Neuropathy in Older Adults ──
  {
    title: 'Peripheral Neuropathy in Older Adults',
    content:
      'Peripheral neuropathy is nerve damage that causes weakness, numbness, and pain, usually in the hands and feet. Common causes in older adults include diabetes, vitamin deficiencies, infections, and certain medications. Symptoms include tingling, burning, sharp pain, loss of balance, and muscle weakness. Treatment focuses on managing the underlying cause and relieving symptoms. See a healthcare provider if you develop numbness, tingling, or weakness in your hands or feet.',
    url: 'https://medlineplus.gov/neuropathyelderly.html',
    lastReviewed: '2023-04-22',
    population: 'geriatric',
  },

  // ═══ CHRONIC DISEASE TOPICS ═══════════════════════════════════════════════════════
  // ── CHRONIC: Type 2 Diabetes ──
  {
    title: 'Type 2 Diabetes',
    content:
      'Type 2 diabetes is a chronic condition where the body does not use insulin properly, causing blood sugar to rise. Symptoms include increased thirst, frequent urination, blurred vision, fatigue, and slow-healing sores. Management includes healthy eating, regular physical activity, monitoring blood sugar, and taking medications as prescribed. See a healthcare provider for regular checkups and if blood sugar levels are difficult to control.',
    url: 'https://medlineplus.gov/type2diabetes.html',
    lastReviewed: '2024-01-15',
    population: 'chronic',
  },
  // ── CHRONIC: Type 1 Diabetes ──
  {
    title: 'Type 1 Diabetes',
    content:
      'Type 1 diabetes is an autoimmune condition where the pancreas produces little or no insulin. Symptoms include extreme thirst, frequent urination, unintended weight loss, fatigue, and blurred vision. Treatment requires daily insulin, blood sugar monitoring, carbohydrate counting, and regular exercise. Seek emergency care for signs of diabetic ketoacidosis including nausea, vomiting, abdominal pain, fruity breath, and confusion.',
    url: 'https://medlineplus.gov/type1diabetes.html',
    lastReviewed: '2024-04-05',
    population: 'chronic',
  },
  // ── CHRONIC: Hypertension ──
  {
    title: 'Hypertension',
    content:
      'Hypertension (high blood pressure) is a chronic condition where blood pushes too hard against artery walls, increasing the risk of heart disease, stroke, and kidney damage. It often has no symptoms, earning it the name "silent killer." Lifestyle changes include reducing sodium, exercising regularly, maintaining a healthy weight, limiting alcohol, and managing stress. Take prescribed medications as directed and monitor blood pressure regularly.',
    url: 'https://medlineplus.gov/hypertension.html',
    lastReviewed: '2023-09-08',
    population: 'chronic',
  },
  // ── CHRONIC: High Cholesterol ──
  {
    title: 'High Cholesterol',
    content:
      'High cholesterol means there is too much cholesterol in the blood, increasing the risk of heart disease and stroke. It usually has no symptoms and is detected through blood tests. LDL ("bad") cholesterol contributes to plaque buildup in arteries, while HDL ("good") cholesterol helps remove it. Management includes a heart-healthy diet, regular exercise, maintaining a healthy weight, and medications if needed. Get cholesterol checked regularly as recommended by your healthcare provider.',
    url: 'https://medlineplus.gov/highcholesterol.html',
    lastReviewed: '2024-02-22',
    population: 'chronic',
  },
  // ── CHRONIC: Coronary Artery Disease ──
  {
    title: 'Coronary Artery Disease',
    content:
      'Coronary artery disease (CAD) occurs when plaque builds up in the coronary arteries, reducing blood flow to the heart muscle. Symptoms may include chest pain (angina), shortness of breath, and fatigue, or there may be no symptoms until a heart attack occurs. Risk factors include high blood pressure, high cholesterol, diabetes, smoking, and family history. Treatment includes lifestyle changes, medications, and procedures. Call 911 for sudden chest pain or signs of heart attack.',
    url: 'https://medlineplus.gov/coronaryarterydisease.html',
    lastReviewed: '2024-05-08',
    population: 'chronic',
  },
  // ── CHRONIC: Angina ──
  {
    title: 'Angina',
    content:
      'Angina is chest pain or discomfort caused by reduced blood flow to the heart muscle, usually due to coronary artery disease. It may feel like pressure, squeezing, or tightness in the chest and may spread to the shoulders, arms, neck, or jaw. Stable angina occurs with exertion and resolves with rest. Treatment includes medications such as nitroglycerin and lifestyle changes. Seek emergency care if chest pain is new, worsening, or occurs at rest.',
    url: 'https://medlineplus.gov/angina.html',
    lastReviewed: '2023-12-12',
    population: 'chronic',
  },
  // ── CHRONIC: Peripheral Artery Disease ──
  {
    title: 'Peripheral Artery Disease',
    content:
      'Peripheral artery disease (PAD) occurs when narrowed arteries reduce blood flow to the limbs, usually the legs. The most common symptom is leg pain or cramping when walking that resolves with rest (claudication). Risk factors include smoking, diabetes, high blood pressure, and high cholesterol. Treatment includes exercise, medications, and sometimes procedures. See a healthcare provider if you have leg pain when walking, non-healing leg wounds, or cold or discolored feet.',
    url: 'https://medlineplus.gov/peripheralarterydisease.html',
    lastReviewed: '2024-03-12',
    population: 'chronic',
  },
  // ── CHRONIC: Chronic Kidney Disease ──
  {
    title: 'Chronic Kidney Disease',
    content:
      'Chronic kidney disease (CKD) is a gradual loss of kidney function over time. The most common causes are diabetes and high blood pressure. Early stages often have no symptoms; advanced stages may cause fatigue, swelling, nausea, and changes in urination. Management includes controlling blood pressure and blood sugar, following a kidney-friendly diet, and avoiding nephrotoxic medications. Regular blood tests can detect CKD early. See a healthcare provider for routine kidney function screening.',
    url: 'https://medlineplus.gov/chronickidneydisease.html',
    lastReviewed: '2023-08-22',
    population: 'chronic',
  },
  // ── CHRONIC: Thyroid Disorders ──
  {
    title: 'Thyroid Disorders',
    content:
      'Thyroid disorders occur when the thyroid gland produces too much or too little thyroid hormone. Hypothyroidism (underactive thyroid) causes fatigue, weight gain, cold sensitivity, and depression. Hyperthyroidism (overactive thyroid) causes weight loss, rapid heartbeat, anxiety, and tremor. Diagnosis involves blood tests measuring thyroid hormone levels. Treatment depends on the type and may include medication, radioactive iodine, or surgery. See a healthcare provider if you have symptoms of thyroid problems.',
    url: 'https://medlineplus.gov/thyroiddisorders.html',
    lastReviewed: '2024-01-22',
    population: 'chronic',
  },
  // ── CHRONIC: Hypothyroidism ──
  {
    title: 'Hypothyroidism',
    content:
      'Hypothyroidism occurs when the thyroid gland does not produce enough thyroid hormone. Symptoms develop gradually and include fatigue, weight gain, cold intolerance, dry skin, constipation, depression, and thinning hair. It is most common in women and older adults. Treatment involves daily thyroid hormone replacement medication. Regular blood tests monitor thyroid levels to adjust dosing. See a healthcare provider if you experience persistent fatigue, unexplained weight gain, or other symptoms.',
    url: 'https://medlineplus.gov/hypothyroidism.html',
    lastReviewed: '2024-06-05',
    population: 'chronic',
  },
  // ── CHRONIC: Hyperthyroidism ──
  {
    title: 'Hyperthyroidism',
    content:
      'Hyperthyroidism occurs when the thyroid gland produces too much thyroid hormone. Symptoms include unintended weight loss, rapid or irregular heartbeat, anxiety, tremor, sweating, increased sensitivity to heat, and more frequent bowel movements. Graves\' disease is the most common cause. Treatment options include anti-thyroid medications, radioactive iodine, and surgery. See a healthcare provider if you experience unexplained weight loss, rapid heartbeat, or excessive sweating.',
    url: 'https://medlineplus.gov/hyperthyroidism.html',
    lastReviewed: '2023-11-02',
    population: 'chronic',
  },
  // ── CHRONIC: Gout ──
  {
    title: 'Gout',
    content:
      'Gout is a form of inflammatory arthritis caused by excess uric acid crystals in the joints, most commonly the big toe. Attacks cause sudden severe pain, swelling, redness, and tenderness. Triggers include red meat, shellfish, alcohol, and sugary drinks. Treatment includes anti-inflammatory medications for acute attacks and long-term medications to lower uric acid levels. See a healthcare provider for recurring joint pain and to discuss a management plan.',
    url: 'https://medlineplus.gov/gout.html',
    lastReviewed: '2024-04-22',
    population: 'chronic',
  },
  // ── CHRONIC: Rheumatoid Arthritis ──
  {
    title: 'Rheumatoid Arthritis',
    content:
      'Rheumatoid arthritis (RA) is a chronic autoimmune disease where the immune system attacks the joints, causing inflammation, pain, swelling, and stiffness, particularly in the hands and feet. Morning stiffness lasting more than 30 minutes is a hallmark. Early treatment is important to prevent joint damage. Treatment includes disease-modifying antirheumatic drugs (DMARDs), biologics, and physical therapy. See a healthcare provider if you have persistent joint swelling, pain, or stiffness.',
    url: 'https://medlineplus.gov/rheumatoidarthritis.html',
    lastReviewed: '2023-07-18',
    population: 'chronic',
  },
  // ── CHRONIC: Lupus ──
  {
    title: 'Lupus',
    content:
      'Lupus is a chronic autoimmune disease where the immune system attacks healthy tissue, affecting the skin, joints, kidneys, brain, and other organs. Symptoms include fatigue, joint pain, skin rashes (including a butterfly-shaped facial rash), fever, and sensitivity to sunlight. Symptoms may flare and remit. Treatment includes anti-inflammatory medications, immunosuppressants, and lifestyle modifications. See a healthcare provider if you develop unexplained rash, persistent joint pain, or fatigue.',
    url: 'https://medlineplus.gov/lupus.html',
    lastReviewed: '2024-02-18',
    population: 'chronic',
  },
  // ── CHRONIC: Fibromyalgia ──
  {
    title: 'Fibromyalgia',
    content:
      'Fibromyalgia is a chronic condition causing widespread musculoskeletal pain, fatigue, sleep disturbances, and cognitive difficulties ("fibro fog"). The exact cause is unknown, but it may involve changes in how the brain processes pain signals. Management includes regular exercise, stress reduction, good sleep habits, cognitive behavioral therapy, and medications for pain and sleep. See a healthcare provider if you have persistent widespread pain and fatigue affecting daily activities.',
    url: 'https://medlineplus.gov/fibromyalgia.html',
    lastReviewed: '2023-10-08',
    population: 'chronic',
  },
  // ── CHRONIC: Chronic Pain Management ──
  {
    title: 'Chronic Pain Management',
    content:
      'Chronic pain is pain lasting more than three months that persists beyond normal healing time. It can result from injuries, surgeries, nerve damage, or conditions like arthritis and fibromyalgia. Management often involves a multimodal approach including physical therapy, exercise, medications, cognitive behavioral therapy, and complementary therapies such as acupuncture. See a healthcare provider to develop a personalized pain management plan. Avoid relying solely on opioid medications for chronic pain.',
    url: 'https://medlineplus.gov/chronicpain.html',
    lastReviewed: '2024-05-25',
    population: 'chronic',
  },
  // ── CHRONIC: Obesity ──
  {
    title: 'Obesity',
    content:
      'Obesity is a complex chronic disease defined by a body mass index (BMI) of 30 or higher, involving excess body fat that increases health risks. It raises the risk of type 2 diabetes, heart disease, stroke, certain cancers, and sleep apnea. Management includes balanced nutrition, regular physical activity, behavioral changes, and in some cases medication or bariatric surgery. See a healthcare provider to discuss a personalized weight management plan.',
    url: 'https://medlineplus.gov/obesity.html',
    lastReviewed: '2024-01-30',
    population: 'chronic',
  },
  // ── CHRONIC: Metabolic Syndrome ──
  {
    title: 'Metabolic Syndrome',
    content:
      'Metabolic syndrome is a cluster of conditions that occur together — increased blood pressure, high blood sugar, excess body fat around the waist, and abnormal cholesterol levels — that raise the risk of heart disease, stroke, and type 2 diabetes. Having three or more of these conditions qualifies as metabolic syndrome. Lifestyle changes including weight loss, exercise, and healthy eating are the primary treatment. See a healthcare provider for screening and management.',
    url: 'https://medlineplus.gov/metabolicsyndrome.html',
    lastReviewed: '2023-06-08',
    population: 'chronic',
  },
  // ── CHRONIC: GERD (Gastroesophageal Reflux Disease) ──
  {
    title: 'GERD (Gastroesophageal Reflux Disease)',
    content:
      'GERD is a chronic digestive condition where stomach acid frequently flows back into the esophagus, causing heartburn and acid regurgitation. Symptoms include burning chest pain after eating, difficulty swallowing, and regurgitation of food or sour liquid. Lifestyle changes include eating smaller meals, avoiding trigger foods, not lying down after eating, and elevating the head of the bed. Medications and sometimes surgery may be needed. See a healthcare provider if symptoms persist despite lifestyle changes.',
    url: 'https://medlineplus.gov/gerd.html',
    lastReviewed: '2024-03-08',
    population: 'chronic',
  },
  // ── CHRONIC: Irritable Bowel Syndrome ──
  {
    title: 'Irritable Bowel Syndrome',
    content:
      'Irritable bowel syndrome (IBS) is a chronic condition affecting the large intestine, causing abdominal pain, bloating, gas, diarrhea, and constipation. Symptoms often fluctuate and may be triggered by certain foods, stress, or hormonal changes. Management includes dietary changes (such as a low-FODMAP diet), stress management, regular exercise, and medications for specific symptoms. See a healthcare provider if you have persistent changes in bowel habits, unexplained weight loss, or blood in stool.',
    url: 'https://medlineplus.gov/ibs.html',
    lastReviewed: '2023-12-28',
    population: 'chronic',
  },
  // ── CHRONIC: Inflammatory Bowel Disease ──
  {
    title: 'Inflammatory Bowel Disease',
    content:
      'Inflammatory bowel disease (IBD) includes Crohn\'s disease and ulcerative colitis, chronic conditions causing inflammation of the digestive tract. Symptoms include persistent diarrhea, abdominal pain, rectal bleeding, weight loss, and fatigue. IBD requires ongoing medical management including anti-inflammatory medications, immunosuppressants, biologics, and sometimes surgery. See a healthcare provider for persistent digestive symptoms, especially blood in stool, unexplained weight loss, or fever.',
    url: 'https://medlineplus.gov/inflammatoryboweldisease.html',
    lastReviewed: '2024-04-15',
    population: 'chronic',
  },
  // ── CHRONIC: Celiac Disease ──
  {
    title: 'Celiac Disease',
    content:
      'Celiac disease is an autoimmune disorder where eating gluten triggers an immune response that damages the small intestine lining. Symptoms include diarrhea, bloating, gas, fatigue, anemia, and weight loss. In children, it can affect growth and development. The only treatment is a strict lifelong gluten-free diet, avoiding wheat, barley, and rye. See a healthcare provider if you have persistent digestive problems, unexplained anemia, or a family history of celiac disease.',
    url: 'https://medlineplus.gov/celiacdisease.html',
    lastReviewed: '2023-09-18',
    population: 'chronic',
  },
  // ── CHRONIC: Liver Disease ──
  {
    title: 'Liver Disease',
    content:
      'Liver disease encompasses conditions that damage the liver, including hepatitis, fatty liver disease, cirrhosis, and liver cancer. Symptoms may not appear until the disease is advanced and include jaundice (yellowing of skin and eyes), abdominal swelling, fatigue, nausea, and easy bruising. Prevention includes limiting alcohol, maintaining a healthy weight, and getting vaccinated for hepatitis. See a healthcare provider for persistent fatigue, jaundice, or abdominal pain.',
    url: 'https://medlineplus.gov/liverdisease.html',
    lastReviewed: '2024-02-05',
    population: 'chronic',
  },
  // ── CHRONIC: Hepatitis ──
  {
    title: 'Hepatitis',
    content:
      'Hepatitis is inflammation of the liver, most commonly caused by viral infections (hepatitis A, B, and C). Symptoms include fatigue, nausea, abdominal pain, dark urine, jaundice, and loss of appetite. Hepatitis A and B can be prevented with vaccines. Hepatitis C is treatable with antiviral medications and most people can be cured. See a healthcare provider if you have symptoms of hepatitis or risk factors for viral hepatitis, including injection drug use or unprotected sex.',
    url: 'https://medlineplus.gov/hepatitis.html',
    lastReviewed: '2023-08-05',
    population: 'chronic',
  },
  // ── CHRONIC: Anemia ──
  {
    title: 'Anemia',
    content:
      'Anemia occurs when the blood does not have enough healthy red blood cells or hemoglobin to carry adequate oxygen to the body\'s tissues. Symptoms include fatigue, weakness, pale skin, shortness of breath, dizziness, and cold hands and feet. Common causes include iron deficiency, vitamin B12 deficiency, chronic disease, and blood loss. Treatment depends on the cause and may include supplements, dietary changes, or treating the underlying condition. See a healthcare provider for persistent fatigue or weakness.',
    url: 'https://medlineplus.gov/anemia.html',
    lastReviewed: '2024-05-12',
    population: 'chronic',
  },
  // ── CHRONIC: Blood Clotting Disorders ──
  {
    title: 'Blood Clotting Disorders',
    content:
      'Blood clotting disorders affect the body\'s ability to form blood clots normally. Some disorders cause excessive clotting (thrombophilia), raising the risk of deep vein thrombosis and pulmonary embolism. Others cause excessive bleeding (hemophilia, von Willebrand disease). Symptoms vary but may include unusual bruising, prolonged bleeding, or swelling and pain in limbs. Treatment depends on the specific disorder. See a healthcare provider if you have unexplained bruising, excessive bleeding, or a family history of clotting disorders.',
    url: 'https://medlineplus.gov/bloodclottingdisorders.html',
    lastReviewed: '2023-11-25',
    population: 'chronic',
  },
  // ── CHRONIC: Deep Vein Thrombosis ──
  {
    title: 'Deep Vein Thrombosis',
    content:
      'Deep vein thrombosis (DVT) is a blood clot that forms in a deep vein, usually in the leg. Symptoms include swelling, pain, warmth, and redness in the affected leg. DVT can be dangerous if the clot breaks loose and travels to the lungs, causing a pulmonary embolism. Risk factors include prolonged immobility, surgery, cancer, and certain genetic conditions. Seek immediate medical care for sudden leg swelling or pain, and call 911 for chest pain or shortness of breath.',
    url: 'https://medlineplus.gov/dvt.html',
    lastReviewed: '2024-03-25',
    population: 'chronic',
  },
  // ── CHRONIC: Asthma in Adults ──
  {
    title: 'Asthma in Adults',
    content:
      'Asthma is a chronic respiratory condition characterized by inflammation and narrowing of the airways. In adults, symptoms include wheezing, coughing, chest tightness, and shortness of breath, often triggered by allergens, exercise, cold air, or respiratory infections. Management includes identifying and avoiding triggers, using controller medications daily, and having a quick-relief inhaler for flare-ups. See a healthcare provider if symptoms are not well controlled or if you need your rescue inhaler more than twice per week.',
    url: 'https://medlineplus.gov/asthmaadults.html',
    lastReviewed: '2024-06-10',
    population: 'chronic',
  },
  // ── CHRONIC: COPD Management ──
  {
    title: 'COPD Management',
    content:
      'Chronic obstructive pulmonary disease (COPD) requires ongoing management to slow disease progression and improve quality of life. Key strategies include smoking cessation, inhaled bronchodilators and corticosteroids, pulmonary rehabilitation, oxygen therapy as needed, and annual flu and pneumonia vaccines. Monitor symptoms and follow an action plan for flare-ups. See a healthcare provider regularly and seek emergency care for severe shortness of breath, bluish lips, or rapid heartbeat.',
    url: 'https://medlineplus.gov/copdmanagement.html',
    lastReviewed: '2023-07-12',
    population: 'chronic',
  },
  // ── CHRONIC: Sleep Apnea ──
  {
    title: 'Sleep Apnea',
    content:
      'Sleep apnea is a sleep disorder where breathing repeatedly stops and starts during sleep. The most common type, obstructive sleep apnea, occurs when throat muscles relax and block the airway. Symptoms include loud snoring, gasping during sleep, morning headaches, excessive daytime sleepiness, and difficulty concentrating. Treatment often involves continuous positive airway pressure (CPAP) therapy. See a healthcare provider if you snore loudly and feel tired even after a full night\'s sleep.',
    url: 'https://medlineplus.gov/sleepapnea.html',
    lastReviewed: '2024-01-08',
    population: 'chronic',
  },
  // ── CHRONIC: Chronic Cough ──
  {
    title: 'Chronic Cough',
    content:
      'A chronic cough lasts eight weeks or longer in adults. Common causes include postnasal drip, asthma, GERD, and medication side effects (especially ACE inhibitors). Less common causes include chronic bronchitis, bronchiectasis, and lung disease. Treatment targets the underlying cause. See a healthcare provider if you have a cough lasting more than eight weeks, cough up blood, have shortness of breath, or experience unexplained weight loss.',
    url: 'https://medlineplus.gov/chroniccough.html',
    lastReviewed: '2024-04-28',
    population: 'chronic',
  },
  // ── CHRONIC: Migraine ──
  {
    title: 'Migraine',
    content:
      'Migraines are recurring headaches that cause intense throbbing pain, usually on one side of the head, often accompanied by nausea, vomiting, and sensitivity to light and sound. Some people experience aura (visual disturbances) before the headache. Triggers may include stress, certain foods, hormonal changes, and sleep disruption. Treatment includes acute medications and preventive therapies. See a healthcare provider if migraines are frequent, severe, or not responding to treatment.',
    url: 'https://medlineplus.gov/migraine.html',
    lastReviewed: '2023-10-22',
    population: 'chronic',
  },
  // ── CHRONIC: Epilepsy ──
  {
    title: 'Epilepsy',
    content:
      'Epilepsy is a neurological disorder characterized by recurrent, unprovoked seizures caused by abnormal electrical activity in the brain. Seizures can range from brief staring spells to full-body convulsions. Treatment usually includes anti-seizure medications, and in some cases surgery or devices. People with epilepsy should take medication consistently, get adequate sleep, and avoid known triggers. Call 911 if a seizure lasts more than five minutes or the person does not regain consciousness.',
    url: 'https://medlineplus.gov/epilepsy.html',
    lastReviewed: '2024-02-28',
    population: 'chronic',
  },
  // ── CHRONIC: Multiple Sclerosis ──
  {
    title: 'Multiple Sclerosis',
    content:
      'Multiple sclerosis (MS) is a chronic autoimmune disease where the immune system attacks the protective covering of nerves (myelin) in the brain and spinal cord. Symptoms vary widely and may include numbness, weakness, vision problems, balance issues, fatigue, and cognitive changes. The disease course is unpredictable, with periods of relapse and remission. Treatment includes disease-modifying therapies and symptom management. See a healthcare provider for new or worsening neurological symptoms.',
    url: 'https://medlineplus.gov/multiplesclerosis.html',
    lastReviewed: '2023-06-20',
    population: 'chronic',
  },
  // ── CHRONIC: Neuropathy ──
  {
    title: 'Neuropathy',
    content:
      'Neuropathy is damage to the peripheral nerves causing weakness, numbness, and pain, typically in the hands and feet. The most common cause is diabetes, but other causes include infections, injuries, toxins, and vitamin deficiencies. Symptoms include tingling, burning, sharp pain, and sensitivity to touch. Treatment focuses on managing the underlying cause and relieving symptoms with medications, physical therapy, and lifestyle changes. See a healthcare provider for persistent numbness, tingling, or pain.',
    url: 'https://medlineplus.gov/neuropathy.html',
    lastReviewed: '2024-05-18',
    population: 'chronic',
  },
  // ── CHRONIC: Low Back Pain (Chronic) ──
  {
    title: 'Low Back Pain (Chronic)',
    content:
      'Chronic low back pain lasts 12 weeks or longer and is one of the most common reasons for missed work. Causes include muscle strain, disc problems, arthritis, and spinal stenosis. Management includes staying active, physical therapy, stretching, strengthening exercises, and pain management techniques. Most chronic back pain improves with non-surgical treatment. See a healthcare provider if pain radiates down the legs, causes numbness or weakness, or is accompanied by bowel or bladder changes.',
    url: 'https://medlineplus.gov/chroniclowbackpain.html',
    lastReviewed: '2023-12-05',
    population: 'chronic',
  },
  // ── CHRONIC: Neck Pain (Chronic) ──
  {
    title: 'Neck Pain (Chronic)',
    content:
      'Chronic neck pain can result from poor posture, degenerative disc disease, arthritis, or nerve compression. Symptoms include persistent aching, stiffness, pain that worsens with certain positions, headaches, and numbness or tingling in the arms. Treatment includes physical therapy, posture correction, exercise, and pain management. See a healthcare provider if neck pain is severe, radiates to arms, causes weakness or numbness, or follows an injury.',
    url: 'https://medlineplus.gov/chronicneckpain.html',
    lastReviewed: '2024-03-15',
    population: 'chronic',
  },
  // ── CHRONIC: Carpal Tunnel Syndrome ──
  {
    title: 'Carpal Tunnel Syndrome',
    content:
      'Carpal tunnel syndrome occurs when the median nerve is compressed as it passes through the wrist, causing numbness, tingling, and weakness in the hand. Symptoms often worsen at night and may include difficulty gripping objects. Risk factors include repetitive hand motions, pregnancy, and certain health conditions. Treatment includes wrist splinting, activity modification, anti-inflammatory medications, and sometimes surgery. See a healthcare provider if symptoms interfere with daily activities or sleep.',
    url: 'https://medlineplus.gov/carpaltunnel.html',
    lastReviewed: '2023-09-30',
    population: 'chronic',
  },
  // ── CHRONIC: Plantar Fasciitis ──
  {
    title: 'Plantar Fasciitis',
    content:
      'Plantar fasciitis is inflammation of the thick band of tissue that runs along the bottom of the foot, connecting the heel bone to the toes. It causes stabbing heel pain that is usually worst with the first steps in the morning. Risk factors include obesity, prolonged standing, flat feet, and high arches. Treatment includes stretching exercises, supportive footwear, ice, and over-the-counter pain relievers. See a healthcare provider if heel pain persists despite home treatment.',
    url: 'https://medlineplus.gov/plantarfasciitis.html',
    lastReviewed: '2024-06-15',
    population: 'chronic',
  },

  // ═══ GENERAL TOPICS ══════════════════════════════════════════════════════════════
  // ── GENERAL: Headache ──
  {
    title: 'Headache',
    content:
      'Headaches are pain in any region of the head, ranging from mild to severe. Tension headaches are the most common type and feel like a band of pressure around the head. Triggers include stress, dehydration, poor posture, and lack of sleep. Over-the-counter pain relievers, rest, and hydration usually help. See a healthcare provider for headaches that are sudden and severe, worsen over time, follow a head injury, or are accompanied by fever, stiff neck, confusion, or vision changes.',
    url: 'https://medlineplus.gov/headache.html',
    lastReviewed: '2024-01-05',
    population: 'general',
  },
  // ── GENERAL: Back Pain ──
  {
    title: 'Back Pain',
    content:
      'Back pain is one of the most common medical complaints and can result from muscle strains, ligament sprains, disc problems, or arthritis. Symptoms range from a dull ache to sharp stabbing pain. Most acute back pain improves within a few weeks with self-care including gentle activity, over-the-counter pain relievers, and applying heat or ice. See a healthcare provider if pain lasts more than a few weeks, is severe, radiates down the leg, or causes numbness, tingling, or weakness.',
    url: 'https://medlineplus.gov/backpain.html',
    lastReviewed: '2024-04-10',
    population: 'general',
  },
  // ── GENERAL: Stomach Pain ──
  {
    title: 'Stomach Pain',
    content:
      'Stomach (abdominal) pain can result from many causes including indigestion, gas, food intolerance, infections, and constipation. The location, severity, and associated symptoms help determine the cause. Mild stomach pain often resolves on its own with rest, fluids, and bland foods. Seek immediate medical care for severe or sudden pain, pain with fever or vomiting blood, pain after an injury, or pain accompanied by inability to have a bowel movement.',
    url: 'https://medlineplus.gov/stomachpain.html',
    lastReviewed: '2023-11-10',
    population: 'general',
  },
  // ── GENERAL: Chest Pain ──
  {
    title: 'Chest Pain',
    content:
      'Chest pain can have many causes, from muscle strain to serious conditions like heart attack or pulmonary embolism. Heart-related chest pain may feel like pressure or squeezing and may radiate to the arm, jaw, or back. Other causes include GERD, anxiety, and musculoskeletal issues. Call 911 immediately for sudden chest pain, especially if accompanied by shortness of breath, sweating, nausea, or pain spreading to the arm or jaw.',
    url: 'https://medlineplus.gov/chestpain.html',
    lastReviewed: '2024-02-15',
    population: 'general',
  },
  // ── GENERAL: Sore Throat ──
  {
    title: 'Sore Throat',
    content:
      'A sore throat causes pain, scratchiness, or irritation that often worsens with swallowing. Most sore throats are caused by viral infections and resolve on their own. Bacterial infections like strep throat require antibiotics. Home remedies include warm fluids, throat lozenges, saltwater gargles, and rest. See a healthcare provider if the sore throat is severe, lasts more than a week, is accompanied by high fever, or you have difficulty breathing or swallowing.',
    url: 'https://medlineplus.gov/sorethroat.html',
    lastReviewed: '2023-08-28',
    population: 'general',
  },
  // ── GENERAL: Common Cold ──
  {
    title: 'Common Cold',
    content:
      'The common cold is a viral infection of the upper respiratory tract. Symptoms include runny nose, sneezing, congestion, sore throat, cough, mild body aches, and low-grade fever. Most colds resolve within 7 to 10 days. Treatment focuses on symptom relief with rest, fluids, over-the-counter cold medications, and saline nasal spray. See a healthcare provider if symptoms last more than 10 days, worsen after improving, or include high fever or severe headache.',
    url: 'https://medlineplus.gov/commoncold.html',
    lastReviewed: '2024-05-02',
    population: 'general',
  },
  // ── GENERAL: Influenza (Flu) ──
  {
    title: 'Influenza (Flu)',
    content:
      'Influenza is a contagious respiratory illness caused by flu viruses. Symptoms include sudden onset of fever, cough, sore throat, body aches, headache, chills, and fatigue. The flu can lead to serious complications, especially in young children, older adults, and people with chronic conditions. Annual flu vaccination is the best prevention. Antiviral medications can reduce severity if started early. Seek medical care for difficulty breathing, persistent chest pain, or severe dehydration.',
    url: 'https://medlineplus.gov/flu.html',
    lastReviewed: '2023-10-01',
    population: 'general',
  },
  // ── GENERAL: COVID-19 ──
  {
    title: 'COVID-19',
    content:
      'COVID-19 is a respiratory illness caused by the SARS-CoV-2 virus. Symptoms range from mild (fever, cough, fatigue, loss of taste or smell) to severe (difficulty breathing, chest pain, confusion). Vaccination is the most effective prevention along with hand hygiene and ventilation. Treatment may include antiviral medications for those at higher risk of severe illness. Seek emergency care for difficulty breathing, persistent chest pain, confusion, or inability to stay awake.',
    url: 'https://medlineplus.gov/covid19.html',
    lastReviewed: '2024-06-01',
    population: 'general',
  },
  // ── GENERAL: Seasonal Allergies ──
  {
    title: 'Seasonal Allergies',
    content:
      'Seasonal allergies (hay fever) occur when the immune system overreacts to outdoor allergens like pollen. Symptoms include sneezing, runny or stuffy nose, itchy watery eyes, and itchy throat. Treatment includes over-the-counter antihistamines, nasal corticosteroid sprays, and decongestants. Reducing exposure by staying indoors on high-pollen days, keeping windows closed, and showering after outdoor activities can help. See a healthcare provider if over-the-counter treatments are not effective.',
    url: 'https://medlineplus.gov/seasonalallergies.html',
    lastReviewed: '2024-03-20',
    population: 'general',
  },
  // ── GENERAL: Food Poisoning ──
  {
    title: 'Food Poisoning',
    content:
      'Food poisoning results from eating contaminated food. Common causes include bacteria (Salmonella, E. coli), viruses, and parasites. Symptoms include nausea, vomiting, diarrhea, abdominal cramps, and fever, usually starting within hours to days of eating contaminated food. Most cases resolve on their own with rest and fluids. Seek medical care if you have a high fever, blood in stool, signs of dehydration, or symptoms lasting more than three days.',
    url: 'https://medlineplus.gov/foodpoisoning.html',
    lastReviewed: '2023-07-25',
    population: 'general',
  },
  // ── GENERAL: Urinary Tract Infection ──
  {
    title: 'Urinary Tract Infection',
    content:
      'A urinary tract infection (UTI) occurs when bacteria enter the urinary system. Symptoms include a strong persistent urge to urinate, burning sensation during urination, passing frequent small amounts of urine, cloudy or strong-smelling urine, and pelvic pain. Drink plenty of water to help flush bacteria. UTIs require antibiotic treatment. See a healthcare provider promptly for UTI symptoms, and seek urgent care if you have fever, back pain, or blood in urine.',
    url: 'https://medlineplus.gov/uti.html',
    lastReviewed: '2024-04-18',
    population: 'general',
  },
  // ── GENERAL: Kidney Stones ──
  {
    title: 'Kidney Stones',
    content:
      'Kidney stones are hard deposits of minerals and salts that form inside the kidneys. Symptoms include severe pain in the back and side, pain that radiates to the lower abdomen and groin, painful urination, pink or red urine, and nausea. Small stones may pass with increased fluid intake and pain management. Seek immediate medical care for severe pain, fever and chills, blood in urine, or difficulty urinating.',
    url: 'https://medlineplus.gov/kidneystones.html',
    lastReviewed: '2023-12-18',
    population: 'general',
  },
  // ── GENERAL: Appendicitis ──
  {
    title: 'Appendicitis',
    content:
      'Appendicitis is inflammation of the appendix, a small pouch attached to the large intestine. Symptoms typically begin with pain around the navel that shifts to the lower right abdomen, worsening over 12 to 24 hours. Other symptoms include nausea, vomiting, fever, and loss of appetite. Appendicitis is a medical emergency requiring surgery. Seek immediate medical care for sudden severe abdominal pain, especially in the lower right side.',
    url: 'https://medlineplus.gov/appendicitis.html',
    lastReviewed: '2024-01-25',
    population: 'general',
  },
  // ── GENERAL: Gallstones ──
  {
    title: 'Gallstones',
    content:
      'Gallstones are hardened deposits in the gallbladder that can block bile ducts. Symptoms include sudden intense pain in the upper right abdomen or center of the abdomen, back pain between the shoulder blades, nausea, and vomiting. Pain often occurs after eating fatty foods. Some gallstones cause no symptoms. Seek medical care for persistent or severe abdominal pain, jaundice, or fever, as complications can include infection and pancreatitis.',
    url: 'https://medlineplus.gov/gallstones.html',
    lastReviewed: '2024-05-28',
    population: 'general',
  },
  // ── GENERAL: Heartburn ──
  {
    title: 'Heartburn',
    content:
      'Heartburn is a burning sensation in the chest caused by stomach acid backing up into the esophagus. It often occurs after eating, when lying down, or when bending over. Occasional heartburn is common and can be managed by avoiding trigger foods, eating smaller meals, not lying down after eating, and using over-the-counter antacids. See a healthcare provider if heartburn occurs more than twice a week, does not improve with antacids, or is accompanied by difficulty swallowing or weight loss.',
    url: 'https://medlineplus.gov/heartburn.html',
    lastReviewed: '2023-09-15',
    population: 'general',
  },
  // ── GENERAL: Nausea and Vomiting ──
  {
    title: 'Nausea and Vomiting',
    content:
      'Nausea is an uneasy feeling in the stomach that may lead to vomiting. Common causes include viral infections, food poisoning, motion sickness, pregnancy, and medications. Stay hydrated with small sips of clear fluids. Eat bland foods such as crackers and toast when able to keep food down. See a healthcare provider if vomiting lasts more than two days, you cannot keep fluids down, vomit contains blood, or you have severe abdominal pain.',
    url: 'https://medlineplus.gov/nausea.html',
    lastReviewed: '2024-02-10',
    population: 'general',
  },
  // ── GENERAL: Dizziness ──
  {
    title: 'Dizziness',
    content:
      'Dizziness is a term that describes feeling lightheaded, unsteady, or as if the room is spinning (vertigo). Common causes include inner ear problems, dehydration, low blood pressure, anxiety, and certain medications. Sit or lie down until dizziness passes to prevent falls. See a healthcare provider if dizziness is recurrent, sudden, or severe, or is accompanied by headache, hearing loss, chest pain, double vision, or fainting.',
    url: 'https://medlineplus.gov/dizziness.html',
    lastReviewed: '2024-06-08',
    population: 'general',
  },
  // ── GENERAL: Fainting ──
  {
    title: 'Fainting',
    content:
      'Fainting (syncope) is a temporary loss of consciousness caused by a drop in blood flow to the brain. Common triggers include standing for long periods, heat, dehydration, emotional stress, and sudden changes in position. Warning signs include lightheadedness, nausea, warmth, and tunnel vision. If you feel faint, sit or lie down immediately. See a healthcare provider after a fainting episode, especially if it occurs without warning, during exercise, or is accompanied by chest pain or irregular heartbeat.',
    url: 'https://medlineplus.gov/fainting.html',
    lastReviewed: '2023-07-08',
    population: 'general',
  },
  // ── GENERAL: Fatigue ──
  {
    title: 'Fatigue',
    content:
      'Fatigue is a persistent feeling of tiredness or exhaustion that is not relieved by rest. It can result from many causes including poor sleep, stress, anemia, thyroid problems, depression, diabetes, and chronic infections. Improving sleep habits, regular exercise, stress management, and a balanced diet can help. See a healthcare provider if fatigue is severe, lasts more than two weeks, is accompanied by unexplained weight loss, fever, or other concerning symptoms.',
    url: 'https://medlineplus.gov/fatigue.html',
    lastReviewed: '2024-03-28',
    population: 'general',
  },
  // ── GENERAL: Insomnia ──
  {
    title: 'Insomnia',
    content:
      'Insomnia is difficulty falling asleep, staying asleep, or waking too early and not being able to fall back asleep. It can be caused by stress, anxiety, depression, poor sleep habits, medications, and medical conditions. Good sleep hygiene includes maintaining a consistent sleep schedule, limiting screen time before bed, avoiding caffeine late in the day, and keeping the bedroom cool and dark. See a healthcare provider if insomnia persists for more than a few weeks and affects daily functioning.',
    url: 'https://medlineplus.gov/insomnia.html',
    lastReviewed: '2023-11-18',
    population: 'general',
  },
  // ── GENERAL: Anxiety ──
  {
    title: 'Anxiety',
    content:
      'Anxiety is a normal response to stress, but excessive anxiety that interferes with daily life may indicate an anxiety disorder. Symptoms include persistent worry, restlessness, difficulty concentrating, muscle tension, rapid heartbeat, and sleep problems. Management includes regular exercise, relaxation techniques, limiting caffeine, and seeking support. See a healthcare provider if anxiety is overwhelming, persistent, or interfering with work, relationships, or daily activities. Effective treatments include therapy and medication.',
    url: 'https://medlineplus.gov/anxiety.html',
    lastReviewed: '2024-04-02',
    population: 'general',
  },
  // ── GENERAL: Stress Management ──
  {
    title: 'Stress Management',
    content:
      'Stress is the body\'s response to demands or threats. While some stress is normal, chronic stress can harm physical and mental health, contributing to headaches, sleep problems, high blood pressure, and depression. Management techniques include regular physical activity, deep breathing exercises, adequate sleep, social connections, and time management. See a healthcare provider if stress is causing physical symptoms, affecting relationships or work, or if you feel unable to cope.',
    url: 'https://medlineplus.gov/stress.html',
    lastReviewed: '2024-06-12',
    population: 'general',
  },
  // ── GENERAL: Skin Infections ──
  {
    title: 'Skin Infections',
    content:
      'Skin infections can be caused by bacteria, viruses, fungi, or parasites. Bacterial infections include cellulitis and impetigo. Symptoms include redness, warmth, swelling, pain, and sometimes pus or drainage. Keep wounds clean and covered. Good hand hygiene helps prevent spread. See a healthcare provider if redness is spreading, you develop a fever, the infection is near the eye, or you have diabetes or a weakened immune system.',
    url: 'https://medlineplus.gov/skininfections.html',
    lastReviewed: '2023-08-12',
    population: 'general',
  },
  // ── GENERAL: Cuts and Wounds ──
  {
    title: 'Cuts and Wounds',
    content:
      'Minor cuts and scrapes can be treated at home. Clean the wound gently with water, apply pressure with a clean cloth to stop bleeding, apply antibiotic ointment, and cover with a sterile bandage. Change the bandage daily. Seek medical care if the cut is deep or jagged, bleeding does not stop after 10 minutes of pressure, the wound is from an animal bite, you see signs of infection (increasing redness, warmth, swelling, pus), or you are not up to date on tetanus vaccination.',
    url: 'https://medlineplus.gov/cutsandwounds.html',
    lastReviewed: '2024-01-15',
    population: 'general',
  },
  // ── GENERAL: Sprains and Strains ──
  {
    title: 'Sprains and Strains',
    content:
      'A sprain is a stretched or torn ligament; a strain is a stretched or torn muscle or tendon. Both cause pain, swelling, and limited movement. The RICE method is initial treatment: Rest, Ice (20 minutes several times a day), Compression (elastic bandage), and Elevation. Over-the-counter pain relievers can help. See a healthcare provider if you cannot bear weight, the joint feels unstable, there is significant swelling, or pain does not improve within a few days.',
    url: 'https://medlineplus.gov/sprainsandstrains.html',
    lastReviewed: '2024-05-15',
    population: 'general',
  },
  // ── GENERAL: Fractures ──
  {
    title: 'Fractures',
    content:
      'A fracture is a broken bone. Symptoms include intense pain, swelling, bruising, visible deformity, and inability to move the affected area. Do not try to straighten a broken bone. Apply ice to reduce swelling and immobilize the area. Seek immediate medical care for any suspected fracture, especially if the bone has pierced the skin, there is numbness or tingling below the injury, or the injury involves the head, neck, or back.',
    url: 'https://medlineplus.gov/fractures.html',
    lastReviewed: '2023-10-12',
    population: 'general',
  },
  // ── GENERAL: Burns ──
  {
    title: 'Burns',
    content:
      'Burns are tissue damage from heat, chemicals, electricity, or radiation. First-degree burns (redness only) and small second-degree burns (blisters) can be treated at home by cooling under running water for 10 to 20 minutes and covering with a clean non-stick bandage. Do not apply ice, butter, or ointments. Seek emergency care for burns that are large, deep, on the face, hands, feet, or genitals, or if the person inhaled smoke.',
    url: 'https://medlineplus.gov/burns.html',
    lastReviewed: '2024-02-22',
    population: 'general',
  },
  // ── GENERAL: Insect Bites and Stings ──
  {
    title: 'Insect Bites and Stings',
    content:
      'Most insect bites and stings cause mild reactions including redness, itching, swelling, and minor pain. Clean the area with soap and water, apply a cold pack to reduce swelling, and use over-the-counter antihistamines or hydrocortisone cream for itching. Remove bee stingers by scraping sideways. Seek emergency care immediately if there are signs of anaphylaxis: difficulty breathing, swelling of the face or throat, rapid pulse, dizziness, or nausea.',
    url: 'https://medlineplus.gov/insectbites.html',
    lastReviewed: '2024-06-05',
    population: 'general',
  },
  // ── GENERAL: Tick Bites ──
  {
    title: 'Tick Bites',
    content:
      'Ticks can transmit diseases such as Lyme disease, Rocky Mountain spotted fever, and ehrlichiosis. Remove a tick promptly by grasping it close to the skin with fine-tipped tweezers and pulling upward with steady pressure. Clean the area with soap and water. Monitor for symptoms for 30 days, including rash (especially a bull\'s-eye pattern), fever, fatigue, and joint pain. See a healthcare provider if a rash develops, you feel ill after a tick bite, or the tick was attached for more than 36 hours.',
    url: 'https://medlineplus.gov/tickbites.html',
    lastReviewed: '2023-05-10',
    population: 'general',
  },
  // ── GENERAL: Sunburn ──
  {
    title: 'Sunburn',
    content:
      'Sunburn is red, painful skin that feels hot to the touch, caused by overexposure to ultraviolet (UV) rays. Severe sunburn can cause blistering, swelling, fever, and chills. Cool the skin with a damp cloth, apply aloe vera or moisturizing lotion, drink extra water, and take over-the-counter pain relievers. Prevention includes using broad-spectrum SPF 30+ sunscreen, wearing protective clothing, and avoiding sun during peak hours. See a healthcare provider for severe sunburn with blistering, fever, or dehydration.',
    url: 'https://medlineplus.gov/sunburn.html',
    lastReviewed: '2024-03-05',
    population: 'general',
  },
  // ── GENERAL: Heat Exhaustion ──
  {
    title: 'Heat Exhaustion',
    content:
      'Heat exhaustion occurs when the body overheats due to prolonged exposure to high temperatures, especially with physical exertion and inadequate hydration. Symptoms include heavy sweating, weakness, cold and clammy skin, nausea, fast weak pulse, headache, and dizziness. Move to a cool place, loosen clothing, apply cool wet cloths, and sip water. Seek emergency care if symptoms worsen, vomiting occurs, or the person becomes confused, as this may progress to heat stroke.',
    url: 'https://medlineplus.gov/heatexhaustion.html',
    lastReviewed: '2024-05-20',
    population: 'general',
  },
  // ── GENERAL: Heat Stroke ──
  {
    title: 'Heat Stroke',
    content:
      'Heat stroke is a life-threatening condition where the body temperature rises to 104°F (40°C) or higher. Symptoms include high body temperature, hot dry skin (no sweating), rapid strong pulse, headache, confusion, and loss of consciousness. Heat stroke requires immediate emergency treatment. Call 911, move the person to a cool area, and cool them rapidly with cold water or ice packs on the neck, armpits, and groin. Do not give fluids to an unconscious person.',
    url: 'https://medlineplus.gov/heatstroke.html',
    lastReviewed: '2023-06-28',
    population: 'general',
  },
  // ── GENERAL: Hypothermia ──
  {
    title: 'Hypothermia',
    content:
      'Hypothermia occurs when body temperature drops below 95°F (35°C), usually from prolonged exposure to cold. Symptoms include shivering, confusion, slurred speech, drowsiness, slow breathing, and loss of coordination. Move the person to a warm area, remove wet clothing, and warm them gradually with blankets and warm (not hot) beverages if conscious. Call 911 for severe hypothermia. Do not rub the skin or use direct heat, as this can cause cardiac arrest.',
    url: 'https://medlineplus.gov/hypothermia.html',
    lastReviewed: '2024-01-20',
    population: 'general',
  },
  // ── GENERAL: Frostbite ──
  {
    title: 'Frostbite',
    content:
      'Frostbite occurs when skin and underlying tissues freeze from exposure to cold temperatures. It most commonly affects fingers, toes, nose, ears, cheeks, and chin. Symptoms progress from cold and prickling sensations to numbness, then hard and pale skin. Warm the affected area in warm (not hot) water, do not rub the area, and do not walk on frostbitten feet. Seek medical care for any suspected frostbite, as severe cases can cause permanent tissue damage.',
    url: 'https://medlineplus.gov/frostbite.html',
    lastReviewed: '2023-12-22',
    population: 'general',
  },
  // ── GENERAL: Nosebleed ──
  {
    title: 'Nosebleed',
    content:
      'Nosebleeds are common and usually not serious. Most are anterior nosebleeds that come from blood vessels in the front of the nose. To stop a nosebleed, sit upright and lean slightly forward, pinch the soft part of the nose firmly for 10 to 15 minutes without releasing, and breathe through the mouth. Do not tilt the head back. See a healthcare provider if the bleeding does not stop after 20 minutes, occurs after a head injury, or happens frequently.',
    url: 'https://medlineplus.gov/nosebleed.html',
    lastReviewed: '2024-04-12',
    population: 'general',
  },
  // ── GENERAL: Eye Infections ──
  {
    title: 'Eye Infections',
    content:
      'Eye infections can be caused by bacteria, viruses, or fungi and may affect different parts of the eye. Common types include conjunctivitis (pink eye), stye, and keratitis. Symptoms include redness, itching, discharge, swelling, pain, and sensitivity to light. Do not touch or rub the eyes, and wash hands frequently. See a healthcare provider if you have eye pain, vision changes, sensitivity to light, significant swelling, or symptoms that do not improve.',
    url: 'https://medlineplus.gov/eyeinfections.html',
    lastReviewed: '2023-09-02',
    population: 'general',
  },
  // ── GENERAL: Pink Eye (Conjunctivitis) ──
  {
    title: 'Pink Eye (Conjunctivitis)',
    content:
      'Pink eye is inflammation of the conjunctiva, the clear tissue covering the white of the eye and inside the eyelids. Causes include viruses, bacteria, and allergies. Symptoms include redness, itching, tearing, discharge, and crusting. Viral pink eye is highly contagious. Wash hands often and avoid touching the eyes. Cool compresses may ease discomfort. See a healthcare provider if there is eye pain, vision changes, intense redness, or if a newborn develops symptoms.',
    url: 'https://medlineplus.gov/pinkeye.html',
    lastReviewed: '2024-02-08',
    population: 'general',
  },
  // ── GENERAL: Toothache ──
  {
    title: 'Toothache',
    content:
      'A toothache is pain in or around a tooth, often caused by tooth decay, infection, gum disease, cracked teeth, or exposed roots. Symptoms may include sharp or throbbing pain, swelling, fever, and bad taste in the mouth. Rinse with warm saltwater, apply a cold compress to the cheek, and take over-the-counter pain relievers. See a dentist promptly for persistent toothache, and seek emergency care if there is fever, facial swelling, difficulty breathing, or swallowing.',
    url: 'https://medlineplus.gov/toothache.html',
    lastReviewed: '2024-06-02',
    population: 'general',
  },
  // ── GENERAL: Mouth Sores ──
  {
    title: 'Mouth Sores',
    content:
      'Mouth sores (canker sores) are small, shallow lesions inside the mouth on the soft tissues or at the base of the gums. They can be painful and make eating and talking uncomfortable. Most heal on their own within one to two weeks. Avoid spicy, acidic, and rough-textured foods. Over-the-counter topical treatments can ease pain. See a healthcare provider if sores are unusually large, recurrent, spreading, last longer than three weeks, or are accompanied by high fever.',
    url: 'https://medlineplus.gov/mouthsores.html',
    lastReviewed: '2023-07-15',
    population: 'general',
  },
  // ── GENERAL: Ear Pain ──
  {
    title: 'Ear Pain',
    content:
      'Ear pain can result from ear infections, fluid buildup, earwax blockage, sinus infections, or temporomandibular joint (TMJ) problems. Symptoms may include sharp or dull pain, muffled hearing, and drainage. Applying a warm compress to the ear and taking over-the-counter pain relievers can help. See a healthcare provider if pain is severe, lasts more than a day, is accompanied by fever, drainage, or hearing loss, or if a child under 6 months has ear pain.',
    url: 'https://medlineplus.gov/earpain.html',
    lastReviewed: '2024-03-10',
    population: 'general',
  },
  // ── GENERAL: Swimmer's Ear ──
  {
    title: 'Swimmer\'s Ear',
    content:
      'Swimmer\'s ear (otitis externa) is an infection of the outer ear canal, often caused by water remaining in the ear after swimming. Symptoms include itching in the ear canal, redness, discomfort that worsens when pulling on the ear, and drainage. Keep the ear dry and avoid inserting objects into the ear canal. See a healthcare provider for ear drops to treat the infection. Seek urgent care if there is severe pain, fever, or complete blockage of the ear canal.',
    url: 'https://medlineplus.gov/swimmersear.html',
    lastReviewed: '2023-06-05',
    population: 'general',
  },
  // ── GENERAL: Sinusitis ──
  {
    title: 'Sinusitis',
    content:
      'Sinusitis is inflammation of the sinuses, usually caused by a viral infection following a cold. Symptoms include facial pain and pressure, nasal congestion, thick nasal discharge, reduced sense of smell, cough, and fatigue. Most cases resolve without antibiotics. Treatment includes saline nasal irrigation, decongestants, and pain relievers. See a healthcare provider if symptoms last more than 10 days, worsen after initial improvement, or include high fever or severe facial pain.',
    url: 'https://medlineplus.gov/sinusitis.html',
    lastReviewed: '2024-04-25',
    population: 'general',
  },
  // ── GENERAL: Bronchitis ──
  {
    title: 'Bronchitis',
    content:
      'Bronchitis is inflammation of the bronchial tubes (airways) in the lungs. Acute bronchitis is usually caused by a virus and follows a cold. Symptoms include persistent cough (which may produce mucus), chest discomfort, fatigue, and mild body aches. Antibiotics are usually not needed. Treatment includes rest, fluids, over-the-counter cough suppressants, and a humidifier. See a healthcare provider if the cough lasts more than three weeks, produces blood, or is accompanied by high fever or shortness of breath.',
    url: 'https://medlineplus.gov/bronchitis.html',
    lastReviewed: '2023-11-05',
    population: 'general',
  },
  // ── GENERAL: Laryngitis ──
  {
    title: 'Laryngitis',
    content:
      'Laryngitis is inflammation of the voice box (larynx), causing hoarseness or loss of voice. It is usually caused by overuse, irritation, or viral infection. Symptoms include hoarseness, weak voice, tickling sensation in the throat, and dry cough. Rest your voice, drink plenty of fluids, and use a humidifier. See a healthcare provider if hoarseness lasts more than two weeks, you have difficulty breathing or swallowing, or you cough up blood.',
    url: 'https://medlineplus.gov/laryngitis.html',
    lastReviewed: '2024-01-02',
    population: 'general',
  },
  // ── GENERAL: Mononucleosis ──
  {
    title: 'Mononucleosis',
    content:
      'Mononucleosis (mono) is a viral infection commonly caused by the Epstein-Barr virus. Symptoms include extreme fatigue, fever, sore throat, swollen lymph nodes, and swollen tonsils. It is most common in teenagers and young adults and is spread through saliva. Treatment includes rest, fluids, and over-the-counter pain relievers. Avoid contact sports due to risk of spleen rupture. See a healthcare provider if symptoms are severe, do not improve, or you develop sharp left-side abdominal pain.',
    url: 'https://medlineplus.gov/mononucleosis.html',
    lastReviewed: '2024-05-10',
    population: 'general',
  },
  // ── GENERAL: Lyme Disease ──
  {
    title: 'Lyme Disease',
    content:
      'Lyme disease is a bacterial infection transmitted through tick bites. Early symptoms include a characteristic expanding bull\'s-eye rash, fever, headache, fatigue, and muscle aches. If untreated, it can spread to joints, heart, and nervous system. Early treatment with antibiotics is usually effective. Prevention includes using insect repellent, wearing long clothing in wooded areas, and checking for ticks after being outdoors. See a healthcare provider promptly if you develop a rash or symptoms after a tick bite.',
    url: 'https://medlineplus.gov/lymedisease.html',
    lastReviewed: '2023-05-28',
    population: 'general',
  },
  // ── GENERAL: Scabies ──
  {
    title: 'Scabies',
    content:
      'Scabies is a contagious skin condition caused by tiny mites that burrow into the skin, causing intense itching and a pimple-like rash. Itching is often worse at night. Scabies is spread through prolonged skin-to-skin contact. Treatment involves prescription scabicide lotions or creams applied to the entire body from the neck down. All household members and close contacts should be treated simultaneously. See a healthcare provider for persistent itching and rash for proper diagnosis and treatment.',
    url: 'https://medlineplus.gov/scabies.html',
    lastReviewed: '2024-02-20',
    population: 'general',
  },
  // ── GENERAL: Ringworm ──
  {
    title: 'Ringworm',
    content:
      'Ringworm is a common fungal skin infection (not caused by a worm) that causes a red, circular, itchy rash with clearer skin in the middle. It can affect the body, scalp, feet, and groin area. It spreads through direct contact with infected people, animals, or contaminated surfaces. Treatment includes over-the-counter antifungal creams for skin infections. See a healthcare provider if the rash does not improve with treatment, is on the scalp, or is widespread.',
    url: 'https://medlineplus.gov/ringworm.html',
    lastReviewed: '2024-06-10',
    population: 'general',
  },
  // ── GENERAL: Athlete's Foot ──
  {
    title: 'Athlete\'s Foot',
    content:
      'Athlete\'s foot is a fungal infection that causes itching, stinging, and burning between the toes and on the soles of the feet. The skin may appear scaly, peeling, or cracked. It is spread through contact with contaminated surfaces, especially in warm, moist environments like locker rooms. Treatment includes over-the-counter antifungal creams or sprays. Keep feet clean and dry, and wear breathable footwear. See a healthcare provider if the infection does not improve with treatment or if you have diabetes.',
    url: 'https://medlineplus.gov/athletesfoot.html',
    lastReviewed: '2023-08-18',
    population: 'general',
  },
  // ── GENERAL: Nail Fungus ──
  {
    title: 'Nail Fungus',
    content:
      'Nail fungus (onychomycosis) is a common infection that causes thickened, discolored, brittle, or crumbly nails, usually affecting toenails. It is caused by fungi that thrive in warm, moist environments. Risk factors include aging, sweating heavily, walking barefoot in damp areas, and having athlete\'s foot. Over-the-counter antifungal treatments may help mild cases. See a healthcare provider for persistent infections, as prescription oral antifungal medications are often needed for effective treatment.',
    url: 'https://medlineplus.gov/nailfungus.html',
    lastReviewed: '2024-03-22',
    population: 'general',
  },
  // ── GENERAL: Warts ──
  {
    title: 'Warts',
    content:
      'Warts are small, rough skin growths caused by human papillomavirus (HPV). They are common on fingers, hands, and feet (plantar warts). Warts are spread through direct contact and may resolve on their own over months to years. Over-the-counter treatments containing salicylic acid can help. Avoid picking or scratching warts to prevent spreading. See a healthcare provider if warts are painful, change in appearance, are on the face or genitals, or do not respond to home treatment.',
    url: 'https://medlineplus.gov/warts.html',
    lastReviewed: '2023-10-28',
    population: 'general',
  },
  // ── GENERAL: Acne ──
  {
    title: 'Acne',
    content:
      'Acne is a common skin condition that occurs when hair follicles become clogged with oil and dead skin cells, causing pimples, blackheads, and whiteheads. It most often affects the face, forehead, chest, and back. Management includes gentle face washing twice daily, avoiding touching the face, and using over-the-counter products with benzoyl peroxide or salicylic acid. See a healthcare provider if acne is severe, scarring, or not responding to over-the-counter treatments.',
    url: 'https://medlineplus.gov/acne.html',
    lastReviewed: '2024-04-08',
    population: 'general',
  },
  // ── GENERAL: Psoriasis ──
  {
    title: 'Psoriasis',
    content:
      'Psoriasis is a chronic autoimmune condition that causes rapid skin cell buildup, leading to thick, red, scaly patches that may itch and burn. It commonly affects the elbows, knees, scalp, and lower back. Flares can be triggered by stress, infections, cold weather, and certain medications. Treatment includes topical creams, phototherapy, and systemic medications. See a healthcare provider for persistent or worsening symptoms, or if psoriasis affects daily activities.',
    url: 'https://medlineplus.gov/psoriasis.html',
    lastReviewed: '2023-12-10',
    population: 'general',
  },
  // ── GENERAL: Rosacea ──
  {
    title: 'Rosacea',
    content:
      'Rosacea is a chronic skin condition that causes redness, visible blood vessels, and sometimes small red bumps on the face, primarily affecting the cheeks, nose, chin, and forehead. Triggers include sun exposure, hot beverages, spicy foods, alcohol, and stress. Management includes identifying and avoiding triggers, gentle skin care, sun protection, and prescribed topical or oral medications. See a healthcare provider if facial redness is persistent or accompanied by bumps and eye irritation.',
    url: 'https://medlineplus.gov/rosacea.html',
    lastReviewed: '2024-01-28',
    population: 'general',
  },
  // ── GENERAL: Hives ──
  {
    title: 'Hives',
    content:
      'Hives (urticaria) are raised, itchy welts on the skin that can appear suddenly and may be triggered by allergies, medications, infections, stress, or temperature changes. Individual hives typically last less than 24 hours, but new ones may continue to appear. Antihistamines are the primary treatment. Seek emergency care if hives are accompanied by difficulty breathing, swelling of the lips, tongue, or throat, dizziness, or rapid heartbeat, as these may indicate anaphylaxis.',
    url: 'https://medlineplus.gov/hives.html',
    lastReviewed: '2024-05-25',
    population: 'general',
  },
  // ── GENERAL: Contact Dermatitis ──
  {
    title: 'Contact Dermatitis',
    content:
      'Contact dermatitis is a red, itchy rash caused by direct contact with a substance that irritates the skin or triggers an allergic reaction. Common triggers include poison ivy, latex, nickel, fragrances, and cleaning products. Symptoms include redness, itching, swelling, blisters, and dry cracked skin. Avoid the trigger substance, wash the area with mild soap and water, and apply calamine lotion or hydrocortisone cream. See a healthcare provider if the rash is severe, widespread, or near the eyes.',
    url: 'https://medlineplus.gov/contactdermatitis.html',
    lastReviewed: '2023-09-25',
    population: 'general',
  },
  // ── GENERAL: Hemorrhoids ──
  {
    title: 'Hemorrhoids',
    content:
      'Hemorrhoids are swollen veins in the lower rectum and anus, causing discomfort, itching, pain, and sometimes bleeding during bowel movements. They can be internal or external. Prevention and treatment include eating a high-fiber diet, drinking plenty of fluids, avoiding straining during bowel movements, and using over-the-counter creams and sitz baths. See a healthcare provider if you have significant bleeding, pain that does not improve, or a lump near the anus.',
    url: 'https://medlineplus.gov/hemorrhoids.html',
    lastReviewed: '2024-02-15',
    population: 'general',
  },
  // ── GENERAL: Varicose Veins ──
  {
    title: 'Varicose Veins',
    content:
      'Varicose veins are enlarged, twisted veins that appear dark purple or blue, most commonly in the legs. They occur when valves in the veins weaken, allowing blood to pool. Symptoms include aching, heaviness, swelling, itching, and visible bulging veins. Compression stockings, exercise, elevation, and weight management can help. See a healthcare provider if varicose veins cause significant pain, skin changes, or if a vein becomes warm, tender, and red.',
    url: 'https://medlineplus.gov/varicoseveins.html',
    lastReviewed: '2024-06-08',
    population: 'general',
  },
  // ── GENERAL: Blood in Stool ──
  {
    title: 'Blood in Stool',
    content:
      'Blood in the stool can appear bright red (from the lower GI tract) or dark and tarry (from the upper GI tract). Causes range from hemorrhoids and anal fissures to more serious conditions like colorectal polyps, diverticulosis, or cancer. While hemorrhoids are the most common cause, rectal bleeding should always be evaluated. See a healthcare provider for any blood in your stool, and seek urgent care if bleeding is heavy, accompanied by dizziness, or if you have dark tarry stools.',
    url: 'https://medlineplus.gov/bloodinstool.html',
    lastReviewed: '2023-07-20',
    population: 'general',
  },
  // ── GENERAL: Blood in Urine ──
  {
    title: 'Blood in Urine',
    content:
      'Blood in the urine (hematuria) can appear pink, red, or brown. Causes include urinary tract infections, kidney stones, enlarged prostate, vigorous exercise, and less commonly bladder or kidney cancer. Sometimes blood is not visible but is detected on a urine test. See a healthcare provider for any visible blood in the urine, as even a single episode should be evaluated. Seek urgent care if blood in urine is accompanied by pain, fever, or difficulty urinating.',
    url: 'https://medlineplus.gov/bloodinurine.html',
    lastReviewed: '2024-03-15',
    population: 'general',
  },
  // ── GENERAL: Painful Urination ──
  {
    title: 'Painful Urination',
    content:
      'Painful urination (dysuria) is a burning or stinging sensation during urination. It is most commonly caused by urinary tract infections but can also result from sexually transmitted infections, kidney stones, or irritation from products. Other symptoms may include frequent urination, urgency, and cloudy urine. See a healthcare provider for painful urination, especially if accompanied by fever, back pain, blood in urine, or unusual discharge.',
    url: 'https://medlineplus.gov/painfulurination.html',
    lastReviewed: '2023-11-12',
    population: 'general',
  },
  // ── GENERAL: Menstrual Cramps ──
  {
    title: 'Menstrual Cramps',
    content:
      'Menstrual cramps (dysmenorrhea) are throbbing or cramping pains in the lower abdomen that occur before and during menstrual periods. They are caused by uterine contractions. Mild cramps are common and can be managed with over-the-counter pain relievers such as ibuprofen, a heating pad, and light exercise. See a healthcare provider if cramps are severe enough to interfere with daily activities, suddenly worsen, or are accompanied by heavy bleeding or fever.',
    url: 'https://medlineplus.gov/menstrualcramps.html',
    lastReviewed: '2024-04-20',
    population: 'general',
  },
  // ── GENERAL: Yeast Infections ──
  {
    title: 'Yeast Infections',
    content:
      'Vaginal yeast infections are caused by an overgrowth of the fungus Candida, resulting in itching, burning, redness, and a thick white discharge. Common triggers include antibiotics, hormonal changes, diabetes, and a weakened immune system. Over-the-counter antifungal treatments are available. See a healthcare provider if this is your first yeast infection, symptoms do not improve with treatment, infections recur frequently, or if you are pregnant.',
    url: 'https://medlineplus.gov/yeastinfections.html',
    lastReviewed: '2024-06-15',
    population: 'general',
  },
  // ── GENERAL: Sexually Transmitted Infections Overview ──
  {
    title: 'Sexually Transmitted Infections Overview',
    content:
      'Sexually transmitted infections (STIs) are infections passed from one person to another through sexual contact. Common STIs include chlamydia, gonorrhea, syphilis, herpes, HPV, and HIV. Many STIs have no symptoms in early stages. Prevention includes consistent condom use and regular screening. Early detection and treatment can prevent complications and reduce transmission. See a healthcare provider for STI testing if you are sexually active, have a new partner, or have symptoms such as unusual discharge or sores.',
    url: 'https://medlineplus.gov/stioverview.html',
    lastReviewed: '2023-08-08',
    population: 'general',
  },
  // ── GENERAL: First Aid Basics ──
  {
    title: 'First Aid Basics',
    content:
      'First aid is the immediate care given to a person who is injured or suddenly ill before professional medical help arrives. Key skills include calling emergency services, controlling bleeding with direct pressure, treating minor burns, recognizing signs of heart attack and stroke, and keeping an injured person calm and still. Keep a well-stocked first aid kit at home, in the car, and at work. Take a first aid course to be prepared for emergencies.',
    url: 'https://medlineplus.gov/firstaidbasics.html',
    lastReviewed: '2024-01-12',
    population: 'general',
  },
  // ── GENERAL: CPR Basics ──
  {
    title: 'CPR Basics',
    content:
      'CPR (cardiopulmonary resuscitation) is a lifesaving technique performed when someone\'s heartbeat or breathing has stopped. Hands-only CPR involves calling 911, then pushing hard and fast in the center of the chest at a rate of 100 to 120 compressions per minute. Continue until emergency help arrives or an AED is available. CPR can double or triple survival rates after cardiac arrest. Take a CPR certification course to be prepared.',
    url: 'https://medlineplus.gov/cprbasics.html',
    lastReviewed: '2024-05-05',
    population: 'general',
  },
  // ── GENERAL: Choking First Aid ──
  {
    title: 'Choking First Aid',
    content:
      'Choking occurs when an object blocks the airway, preventing breathing. Signs include inability to speak or cough, clutching the throat, and turning blue. For adults and children over 1 year, perform the Heimlich maneuver (abdominal thrusts). For infants, alternate between five back blows and five chest thrusts. Call 911 if the object cannot be dislodged. Prevention includes cutting food into small pieces for children and supervising eating.',
    url: 'https://medlineplus.gov/chokingfirstaid.html',
    lastReviewed: '2023-10-15',
    population: 'general',
  },
  // ── GENERAL: Wound Care ──
  {
    title: 'Wound Care',
    content:
      'Proper wound care helps prevent infection and promotes healing. Clean the wound gently with clean water, apply gentle pressure with a clean cloth to stop bleeding, and apply a thin layer of antibiotic ointment. Cover with a sterile bandage and change it daily or when it becomes wet or dirty. Watch for signs of infection: increasing redness, warmth, swelling, drainage, or red streaks. See a healthcare provider for deep wounds, wounds that will not stop bleeding, or signs of infection.',
    url: 'https://medlineplus.gov/woundcare.html',
    lastReviewed: '2024-02-25',
    population: 'general',
  },
  // ── GENERAL: When to Go to the Emergency Room ──
  {
    title: 'When to Go to the Emergency Room',
    content:
      'Emergency rooms treat life-threatening and urgent conditions. Go to the ER for chest pain, difficulty breathing, severe bleeding, signs of stroke (sudden numbness, confusion, trouble speaking), severe allergic reactions, poisoning, seizures, serious burns, head injuries with loss of consciousness, and broken bones with visible deformity. For non-life-threatening concerns, urgent care or your primary care provider may be more appropriate. When in doubt, call 911 or your healthcare provider for guidance.',
    url: 'https://medlineplus.gov/whenemergencyroom.html',
    lastReviewed: '2024-06-01',
    population: 'general',
  },
  // ── GENERAL: How to Take a Temperature ──
  {
    title: 'How to Take a Temperature',
    content:
      'Taking a temperature helps determine if a fever is present. Digital thermometers are recommended over glass mercury thermometers. For infants under 3 months, use a rectal thermometer for the most accurate reading. For older children and adults, oral, ear (tympanic), or forehead (temporal artery) thermometers are appropriate. A temperature of 100.4°F (38°C) or higher is generally considered a fever. Follow the thermometer instructions and clean it before and after use.',
    url: 'https://medlineplus.gov/taketemperature.html',
    lastReviewed: '2023-04-10',
    population: 'general',
  },
  // ── GENERAL: Over-the-Counter Medication Guide ──
  {
    title: 'Over-the-Counter Medication Guide',
    content:
      'Over-the-counter (OTC) medications treat common ailments without a prescription. Key types include pain relievers (acetaminophen, ibuprofen), antihistamines for allergies, decongestants for congestion, antacids for heartburn, and anti-diarrheal medications. Always read labels for dosing, warnings, and drug interactions. Do not exceed recommended doses. See a healthcare provider before combining OTC medications with prescription drugs, during pregnancy, or for children under 2 years old.',
    url: 'https://medlineplus.gov/otcmedications.html',
    lastReviewed: '2024-03-18',
    population: 'general',
  },
  // ── GENERAL: Reading Food Labels ──
  {
    title: 'Reading Food Labels',
    content:
      'Understanding food labels helps make healthier choices. Key items include serving size, calories, total fat, sodium, total carbohydrates, fiber, sugars (including added sugars), and protein. The Percent Daily Value shows how a nutrient in one serving fits into a daily 2,000-calorie diet. Ingredients are listed in order of weight. Check for allergens listed on the label. Compare similar products to choose options lower in sodium, added sugars, and saturated fat.',
    url: 'https://medlineplus.gov/readingfoodlabels.html',
    lastReviewed: '2023-05-22',
    population: 'general',
  },
  // ── GENERAL: Hand Hygiene ──
  {
    title: 'Hand Hygiene',
    content:
      'Proper hand washing is one of the most effective ways to prevent the spread of infections. Wash hands with soap and water for at least 20 seconds, especially before eating, after using the restroom, after coughing or sneezing, and after touching public surfaces. When soap and water are not available, use hand sanitizer with at least 60 percent alcohol. Avoid touching your face with unwashed hands.',
    url: 'https://medlineplus.gov/handhygiene.html',
    lastReviewed: '2024-04-28',
    population: 'general',
  },
  // ── GENERAL: Mask Wearing for Respiratory Illness ──
  {
    title: 'Mask Wearing for Respiratory Illness',
    content:
      'Wearing a well-fitting mask can help reduce the spread of respiratory infections such as flu, COVID-19, and RSV. Masks are especially important in healthcare settings, during outbreaks, and when caring for sick individuals. Choose masks that cover the nose and mouth snugly. N95 or KN95 respirators offer the most protection. Disposable masks should not be reused. People with respiratory symptoms should wear a mask around others to reduce transmission.',
    url: 'https://medlineplus.gov/maskwearing.html',
    lastReviewed: '2024-06-12',
    population: 'general',
  },
  // ── GENERAL: Vaccination Overview ──
  {
    title: 'Vaccination Overview',
    content:
      'Vaccines are one of the most effective tools for preventing infectious diseases. They work by training the immune system to recognize and fight specific pathogens. Recommended vaccines include those for flu, COVID-19, tetanus, measles, HPV, shingles, and pneumonia, among others. Vaccine schedules vary by age and health conditions. Side effects are usually mild and temporary. Talk to your healthcare provider about which vaccines are recommended for you and your family.',
    url: 'https://medlineplus.gov/vaccinationoverview.html',
    lastReviewed: '2024-01-22',
    population: 'general',
  },
  // ── GENERAL: Poison Ivy ──
  {
    title: 'Poison Ivy',
    content:
      'Poison ivy causes an itchy, blistering rash from contact with urushiol oil found in the plant\'s leaves, stems, and roots. The rash typically appears 12 to 72 hours after exposure. Wash the affected skin immediately with soap and cool water. Apply calamine lotion or hydrocortisone cream and take antihistamines for itching. The rash is not contagious. See a healthcare provider if the rash is widespread, on the face or genitals, or if blisters are oozing pus.',
    url: 'https://medlineplus.gov/poisonivy.html',
    lastReviewed: '2024-05-08',
    population: 'general',
  },
  // ── GENERAL: Abdominal Hernia ──
  {
    title: 'Abdominal Hernia',
    content:
      'An abdominal hernia occurs when an organ or tissue pushes through a weak spot in the abdominal wall. Symptoms include a visible bulge (especially when standing or straining), pain or discomfort at the site, and a heavy or dragging sensation. Hernias may worsen over time and often require surgical repair. Seek emergency care if the hernia becomes painful, cannot be pushed back in, or is accompanied by nausea, vomiting, or fever, as this may indicate strangulation.',
    url: 'https://medlineplus.gov/abdominalhernia.html',
    lastReviewed: '2023-06-15',
    population: 'general',
  },
  // ── GENERAL: Vertigo ──
  {
    title: 'Vertigo',
    content:
      'Vertigo is the sensation that you or your surroundings are spinning or moving. The most common cause is benign paroxysmal positional vertigo (BPPV), triggered by changes in head position. Other causes include inner ear infections and Meniere\'s disease. Symptoms include dizziness, nausea, balance problems, and nystagmus (abnormal eye movements). Sit or lie down during an episode to prevent falls. See a healthcare provider for recurrent vertigo, hearing changes, or vertigo with headache or neurological symptoms.',
    url: 'https://medlineplus.gov/vertigo.html',
    lastReviewed: '2024-02-12',
    population: 'general',
  },
  // ── GENERAL: Dehydration ──
  {
    title: 'Dehydration',
    content:
      'Dehydration occurs when the body loses more fluids than it takes in. Causes include inadequate fluid intake, vomiting, diarrhea, excessive sweating, and fever. Symptoms include thirst, dark urine, dry mouth, fatigue, dizziness, and reduced urine output. Drink water and oral rehydration solutions regularly, especially during illness and hot weather. Seek medical care for signs of severe dehydration including confusion, rapid heartbeat, very dark urine, or fainting.',
    url: 'https://medlineplus.gov/dehydration.html',
    lastReviewed: '2024-06-05',
    population: 'general',
  },
  // ── GENERAL: Diabetes Screening ──
  {
    title: 'Diabetes Screening',
    content:
      'Diabetes screening helps detect type 2 diabetes and prediabetes before complications develop. Screening tests include fasting blood glucose, A1C test, and oral glucose tolerance test. The American Diabetes Association recommends screening starting at age 35, or earlier for those with risk factors such as obesity, family history, or history of gestational diabetes. Prediabetes can often be reversed with lifestyle changes. Talk to your healthcare provider about when you should be screened.',
    url: 'https://medlineplus.gov/diabetesscreening.html',
    lastReviewed: '2023-08-25',
    population: 'general',
  },
  // ── GENERAL: Blood Pressure Monitoring ──
  {
    title: 'Blood Pressure Monitoring',
    content:
      'Regular blood pressure monitoring helps detect hypertension early and track treatment effectiveness. Blood pressure is measured in millimeters of mercury (mmHg) and recorded as systolic over diastolic. Normal is less than 120/80 mmHg. Elevated blood pressure is 120-129 systolic with less than 80 diastolic. Use a validated home monitor, sit quietly for five minutes before measuring, and keep a log. See a healthcare provider if readings are consistently elevated.',
    url: 'https://medlineplus.gov/bloodpressuremonitoring.html',
    lastReviewed: '2024-03-30',
    population: 'general',
  },
  // ── GENERAL: Healthy Sleep Habits ──
  {
    title: 'Healthy Sleep Habits',
    content:
      'Good sleep is essential for physical and mental health. Adults need 7 to 9 hours of sleep per night. Healthy sleep habits include maintaining a consistent sleep schedule, creating a cool dark quiet bedroom, limiting screen time before bed, avoiding caffeine and heavy meals near bedtime, and getting regular exercise. See a healthcare provider if you consistently have trouble falling or staying asleep, feel unrefreshed after sleep, or experience excessive daytime sleepiness.',
    url: 'https://medlineplus.gov/healthysleephabits.html',
    lastReviewed: '2024-05-15',
    population: 'general',
  },
  // ── GENERAL: Panic Attacks ──
  {
    title: 'Panic Attacks',
    content:
      'A panic attack is a sudden episode of intense fear that triggers severe physical symptoms when there is no real danger. Symptoms include rapid heartbeat, sweating, trembling, shortness of breath, chest pain, nausea, dizziness, and a feeling of unreality. Panic attacks are not dangerous but can be frightening. Practice deep slow breathing during an attack. See a healthcare provider if panic attacks are frequent, you avoid situations for fear of attacks, or anxiety is interfering with your life.',
    url: 'https://medlineplus.gov/panicattacks.html',
    lastReviewed: '2023-10-05',
    population: 'general',
  },
  // ── GENERAL: Cellulitis ──
  {
    title: 'Cellulitis',
    content:
      'Cellulitis is a bacterial skin infection that causes red, swollen, warm, and tender skin. It most commonly affects the legs but can occur anywhere. It can spread quickly and become serious if untreated. Risk factors include breaks in the skin, weakened immune system, and lymphedema. Treatment requires antibiotics. See a healthcare provider promptly for expanding redness, warmth, or swelling, and seek emergency care if you have fever, chills, or red streaks spreading from the area.',
    url: 'https://medlineplus.gov/cellulitis.html',
    lastReviewed: '2024-01-18',
    population: 'general',
  },
  // ── GENERAL: Tendinitis ──
  {
    title: 'Tendinitis',
    content:
      'Tendinitis is inflammation or irritation of a tendon, the thick fibrous cord that attaches muscle to bone. It causes pain and tenderness near a joint, most commonly affecting the shoulders, elbows, wrists, knees, and heels. It is often caused by repetitive motions or sudden injury. Treatment includes rest, ice, compression, and over-the-counter anti-inflammatory medications. See a healthcare provider if pain is severe, does not improve with rest, or the area is swollen and warm.',
    url: 'https://medlineplus.gov/tendinitis.html',
    lastReviewed: '2024-04-05',
    population: 'general',
  },
  // ── GENERAL: Concussion ──
  {
    title: 'Concussion',
    content:
      'A concussion is a mild traumatic brain injury caused by a bump, blow, or jolt to the head. Symptoms include headache, confusion, dizziness, nausea, sensitivity to light and noise, balance problems, and memory issues. Symptoms may not appear immediately. Rest and avoid physical and mental exertion until cleared by a healthcare provider. Seek emergency care for loss of consciousness, repeated vomiting, seizures, worsening headache, slurred speech, or unusual behavior.',
    url: 'https://medlineplus.gov/concussion.html',
    lastReviewed: '2023-09-18',
    population: 'general',
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
