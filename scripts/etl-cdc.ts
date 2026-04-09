/**
 * CDC ETL — Pre-extracted CDC-authored health topic summaries
 * Source: https://www.cdc.gov/
 * License: US Government Public Domain
 *
 * Run with: npx tsx scripts/etl-cdc.ts
 *
 * All content below is sourced from CDC.gov public domain pages.
 * No third-party or WHO content is included.
 */

interface CDCChunk {
  title: string;
  content: string;
  url: string;
  lastReviewed: string;
  population: string;
}

const CDC_TOPICS: CDCChunk[] = [
  // ── Flu Prevention ────────────────────────────────────────────────
  {
    title: 'Flu Prevention: Steps to Protect Yourself',
    content:
      'The single best way to prevent the flu is to get a flu vaccine each year. The CDC recommends annual flu vaccination for everyone 6 months and older. In addition to vaccination, take everyday preventive actions: wash hands often with soap and water for at least 20 seconds, avoid touching your eyes, nose, and mouth, avoid close contact with sick people, cover your coughs and sneezes, clean and disinfect frequently touched surfaces, and stay home when you are sick. If you get the flu, antiviral drugs can make the illness milder.',
    url: 'https://www.cdc.gov/flu/prevent/index.html',
    lastReviewed: '2024-02-15',
    population: 'general',
  },
  // ── Hand Hygiene ──────────────────────────────────────────────────
  {
    title: 'Handwashing: Clean Hands Save Lives',
    content:
      'Handwashing with soap and water is one of the most important steps to avoid getting sick and spreading germs. Wet hands, lather with soap, scrub for at least 20 seconds (including backs of hands, between fingers, and under nails), rinse well, and dry. Key times to wash hands: before eating or preparing food, after using the toilet, after blowing your nose or coughing, after touching animals, and after caring for someone who is sick. If soap and water are not available, use a hand sanitizer with at least 60% alcohol.',
    url: 'https://www.cdc.gov/clean-hands/',
    lastReviewed: '2024-01-20',
    population: 'general',
  },
  // ── Childhood Vaccine Schedule ────────────────────────────────────
  {
    title: 'Recommended Child and Adolescent Immunization Schedule',
    content:
      'The CDC recommends vaccinations from birth through 18 years to protect against serious diseases. Key vaccines include: Hepatitis B (birth), DTaP (diphtheria, tetanus, pertussis) series starting at 2 months, IPV (polio) series starting at 2 months, MMR (measles, mumps, rubella) at 12-15 months, Varicella (chickenpox) at 12-15 months, and annual influenza vaccine starting at 6 months. Staying on schedule provides the best protection. Talk to your child\'s healthcare provider about any missed vaccines.',
    url: 'https://www.cdc.gov/vaccines/schedules/hcp/imz/child-adolescent.html',
    lastReviewed: '2024-03-01',
    population: 'pediatric',
  },
  // ── Adult Vaccine Schedule ────────────────────────────────────────
  {
    title: 'Recommended Adult Immunization Schedule',
    content:
      'Adults need vaccines too. The CDC recommends: annual influenza vaccine for all adults, Td/Tdap booster every 10 years, shingles vaccine (Shingrix) for adults 50 and older, pneumococcal vaccine for adults 65 and older and younger adults with certain conditions, and COVID-19 vaccine updates as recommended. Adults with chronic conditions such as diabetes, heart disease, or lung disease may need additional vaccines. Consult your healthcare provider for a personalized schedule.',
    url: 'https://www.cdc.gov/vaccines/schedules/hcp/imz/adult.html',
    lastReviewed: '2024-03-01',
    population: 'general',
  },
  // ── Heat-Related Illness ──────────────────────────────────────────
  {
    title: 'Heat-Related Illness: Prevention and Symptoms',
    content:
      'Extreme heat can cause illness and death. Heat exhaustion symptoms include heavy sweating, weakness, cold/pale/clammy skin, nausea, and fainting. Heat stroke is a medical emergency with symptoms of high body temperature (above 103°F/39.4°C), hot/red/dry skin, rapid pulse, confusion, and loss of consciousness. To prevent heat illness: drink plenty of fluids, wear lightweight clothing, limit outdoor activity during peak heat, never leave children or pets in cars, and check on elderly neighbors. For heat stroke, call emergency services immediately.',
    url: 'https://www.cdc.gov/extreme-heat/',
    lastReviewed: '2024-04-10',
    population: 'general',
  },
  // ── Food Safety ───────────────────────────────────────────────────
  {
    title: 'Food Safety: Four Steps to Food Safety',
    content:
      'Follow four steps to help keep food safe: Clean — wash hands and surfaces often. Separate — do not cross-contaminate; keep raw meat, poultry, seafood, and eggs away from ready-to-eat foods. Cook — use a food thermometer to ensure foods reach safe internal temperatures (165°F/74°C for poultry, 160°F/71°C for ground meat, 145°F/63°C for steaks and fish). Chill — refrigerate perishable foods within 2 hours (1 hour if above 90°F/32°C). Foodborne illness symptoms include nausea, vomiting, diarrhea, and fever.',
    url: 'https://www.cdc.gov/food-safety/',
    lastReviewed: '2024-01-30',
    population: 'general',
  },
  // ── Fall Prevention (Older Adults) ────────────────────────────────
  {
    title: 'CDC STEADI: Fall Prevention for Older Adults',
    content:
      'One in four Americans aged 65 and older falls each year. Falls are the leading cause of injury death among older adults. The CDC STEADI (Stopping Elderly Accidents, Deaths & Injuries) initiative recommends: talk to your doctor about fall risk, do strength and balance exercises, have your eyes checked annually, make your home safer by removing tripping hazards and adding grab bars, and review medications that may cause dizziness. If you fall, tell your doctor even if you are not hurt.',
    url: 'https://www.cdc.gov/steadi/',
    lastReviewed: '2024-02-20',
    population: 'geriatric',
  },
  // ── Physical Activity ─────────────────────────────────────────────
  {
    title: 'Physical Activity Guidelines',
    content:
      'Adults need at least 150 minutes of moderate-intensity aerobic activity per week (such as brisk walking) plus muscle-strengthening activities on 2 or more days per week. Children and adolescents need 60 minutes or more of physical activity daily. Older adults should include balance training in addition to aerobic and strengthening activities. Any amount of physical activity is better than none. Start slowly and gradually increase. Regular physical activity reduces risk of heart disease, diabetes, some cancers, and depression.',
    url: 'https://www.cdc.gov/physical-activity-basics/',
    lastReviewed: '2024-03-15',
    population: 'general',
  },
  // ── Diabetes Prevention ───────────────────────────────────────────
  {
    title: 'Preventing Type 2 Diabetes',
    content:
      'More than 1 in 3 US adults have prediabetes, and most do not know it. Risk factors include being overweight, age 45 or older, family history, and physical inactivity. The CDC Diabetes Prevention Program shows that losing 5-7% of body weight and getting 150 minutes of physical activity per week can reduce risk of type 2 diabetes by 58%. Get tested if you have risk factors. Small changes — healthier eating, moving more, and managing stress — can make a big difference.',
    url: 'https://www.cdc.gov/diabetes/prevention-type-2/',
    lastReviewed: '2024-02-01',
    population: 'chronic',
  },
  // ── High Blood Pressure ───────────────────────────────────────────
  {
    title: 'CDC: Managing High Blood Pressure',
    content:
      'Nearly half of US adults have high blood pressure. High blood pressure usually has no warning signs. It increases risk for heart disease and stroke, the leading causes of death. Know your numbers: normal is less than 120/80 mmHg. Manage high blood pressure by eating a healthy diet low in salt, getting regular physical activity, maintaining a healthy weight, not smoking, limiting alcohol, taking medication as prescribed, and monitoring blood pressure at home.',
    url: 'https://www.cdc.gov/high-blood-pressure/',
    lastReviewed: '2024-03-10',
    population: 'chronic',
  },
  // ── Antibiotic Resistance ─────────────────────────────────────────
  {
    title: 'Antibiotic Resistance and Proper Use',
    content:
      'Antibiotic resistance is one of the biggest public health challenges. Antibiotics treat bacterial infections, not viral infections like colds, flu, or most sore throats. Taking antibiotics when not needed contributes to resistance. Always take antibiotics exactly as prescribed, never share antibiotics, and never use leftover antibiotics. Ask your healthcare provider if an antibiotic is truly needed. Protect yourself by getting recommended vaccines, washing hands, preparing food safely, and staying home when sick.',
    url: 'https://www.cdc.gov/antibiotic-use/',
    lastReviewed: '2024-01-25',
    population: 'general',
  },
  // ── Respiratory Virus Prevention ──────────────────────────────────
  {
    title: 'Preventing Respiratory Viruses',
    content:
      'Respiratory viruses including flu, RSV, and COVID-19 spread through droplets and aerosols. Protect yourself and others: stay up to date on recommended vaccines, improve ventilation indoors, wash hands frequently, cover coughs and sneezes, stay home when sick, and consider wearing a mask in crowded indoor spaces during high-transmission periods. People at higher risk (older adults, young children, pregnant women, immunocompromised) should take extra precautions and seek early treatment if symptomatic.',
    url: 'https://www.cdc.gov/respiratory-viruses/',
    lastReviewed: '2024-04-01',
    population: 'general',
  },
  // ── Heart Disease Prevention ──────────────────────────────────────
  {
    title: 'CDC: Heart Disease Prevention',
    content:
      'Heart disease is the leading cause of death in the United States. Key prevention strategies: eat a healthy diet rich in fruits, vegetables, and whole grains; get at least 150 minutes of physical activity per week; maintain a healthy weight; do not smoke or use tobacco; limit alcohol; manage stress; control blood pressure, cholesterol, and blood sugar; and take medications as prescribed. Know the warning signs of heart attack: chest pain, shortness of breath, pain in arms/back/neck/jaw, and lightheadedness.',
    url: 'https://www.cdc.gov/heart-disease/',
    lastReviewed: '2024-02-28',
    population: 'chronic',
  },
  // ── Childhood Injury Prevention ───────────────────────────────────
  {
    title: 'Preventing Childhood Injuries',
    content:
      'Unintentional injuries are the leading cause of death among children in the United States. Top causes include motor vehicle crashes, drowning, fires, falls, and poisoning. Prevention measures: always use age-appropriate car seats and seat belts, supervise children near water, install smoke alarms and practice fire escape plans, use safety gates on stairs for toddlers, store medicines and cleaning products out of reach, and ensure children wear helmets when biking. Poison control: call 1-800-222-1222 if poisoning is suspected.',
    url: 'https://www.cdc.gov/child-injury/',
    lastReviewed: '2024-03-20',
    population: 'pediatric',
  },
  // ── Stroke Signs and Prevention ───────────────────────────────────
  {
    title: 'CDC: Stroke Signs and Prevention',
    content:
      'Stroke is a leading cause of death and serious long-term disability. Use FAST to recognize stroke: Face drooping, Arm weakness, Speech difficulty, Time to call emergency services. Other signs include sudden numbness, confusion, trouble seeing, trouble walking, and severe headache with no known cause. Prevention: manage high blood pressure, eat healthy, stay active, maintain a healthy weight, do not smoke, limit alcohol, and treat heart conditions. Call emergency services immediately for any stroke symptoms — treatment within hours can reduce disability.',
    url: 'https://www.cdc.gov/stroke/',
    lastReviewed: '2024-03-05',
    population: 'geriatric',
  },
  // ── Older Adult Health ────────────────────────────────────────────
  {
    title: 'Healthy Aging: Tips for Older Adults',
    content:
      'Healthy aging involves staying physically active, eating well, getting enough sleep, staying socially connected, and managing chronic conditions. Get recommended health screenings and vaccinations. Take medications as directed and keep a current medication list. Prevent falls by exercising for strength and balance, checking vision, and removing home hazards. Stay mentally active through reading, puzzles, and social activities. Talk to your doctor about any changes in memory, mood, or daily functioning.',
    url: 'https://www.cdc.gov/healthy-aging/',
    lastReviewed: '2024-04-05',
    population: 'geriatric',
  },
];

// Output as JSON lines for knowledge_chunks import
function main() {
  console.log(`CDC ETL: ${CDC_TOPICS.length} CDC-authored topics extracted`);
  for (const topic of CDC_TOPICS) {
    const chunk = {
      title: topic.title,
      content: topic.content,
      population: topic.population,
      source_type: 'cdc',
      source_ref: topic.url,
      source_date: topic.lastReviewed,
      review_status: 'pending_medical_review',
      metadata: { language: 'en', us_gov_public_domain: true },
    };
    console.log(JSON.stringify(chunk));
  }
}

main();
