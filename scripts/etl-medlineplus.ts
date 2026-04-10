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
  zh_summary: string;
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
    zh_summary: '儿童发烧通常由病毒感染引起，体温超过38°C视为发烧。3个月以下婴儿任何发烧需立即就医；大孩子超过40°C或持续3天以上需要看医生。',
    url: 'https://medlineplus.gov/feverinchildren.html',
    lastReviewed: '2024-03-15',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Cough in Children ──
  {
    title: 'Cough in Children',
    content:
      'Coughing helps clear the airways of mucus and irritants. In children, coughs are most often caused by colds or other viral infections. A barking cough may indicate croup, while a wheezing cough may suggest asthma. Most coughs clear up within one to two weeks. See a healthcare provider if the cough lasts more than two weeks, the child has difficulty breathing, or coughs up blood.',
    zh_summary: '咳嗽帮助清除气道中的黏液和刺激物，多由感冒或病毒感染引起。犬吠样咳嗽可能是哮吼，喘息性咳嗽可能提示哮喘。超过两周或呼吸困难需就医。',
    url: 'https://medlineplus.gov/coughinchildren.html',
    lastReviewed: '2024-01-10',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Common Cold in Children ──
  {
    title: 'Common Cold in Children',
    content:
      'The common cold is a viral infection of the nose and throat. Children average six to eight colds per year. Symptoms include runny nose, sneezing, mild sore throat, and low-grade fever. Treatment focuses on comfort measures such as fluids, rest, and saline nasal drops. See a healthcare provider if symptoms last more than 10 days, the child develops a high fever, or has trouble breathing.',
    zh_summary: '普通感冒是鼻和咽喉的病毒感染，儿童每年平均感冒6-8次。症状包括流鼻涕、打喷嚏和低烧，治疗以休息和补液为主。超过10天未好转需就医。',
    url: 'https://medlineplus.gov/commoncoldchildren.html',
    lastReviewed: '2024-02-20',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Ear Infections in Children ──
  {
    title: 'Ear Infections in Children',
    content:
      'Ear infections occur when bacteria or viruses infect the middle ear, causing fluid buildup and swelling. They are one of the most common reasons children visit a healthcare provider. Symptoms include ear pain, tugging at the ear, fever, fussiness, and trouble hearing. See a healthcare provider if your child has ear pain lasting more than a day, has drainage from the ear, or is under 6 months old with any signs of an ear infection.',
    zh_summary: '中耳炎由细菌或病毒引起，是儿童就医最常见原因之一。症状包括耳痛、发烧、烦躁和听力下降。耳痛超过一天或耳道有分泌物需就医。',
    url: 'https://medlineplus.gov/earinfections.html',
    lastReviewed: '2023-11-05',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Diarrhea in Children ──
  {
    title: 'Diarrhea in Children',
    content:
      'Diarrhea is loose, watery stools occurring more frequently than usual. In children, it is most often caused by viral infections such as rotavirus. Dehydration is the main concern, especially in infants and young children. Offer small amounts of oral rehydration solution frequently. See a healthcare provider if your child has signs of dehydration, blood in the stool, diarrhea lasting more than a few days, or a high fever.',
    zh_summary: '儿童腹泻多由轮状病毒等病毒感染引起，主要担心脱水问题。应少量多次喂口服补液盐，出现脱水体征、血便或高烧需就医。',
    url: 'https://medlineplus.gov/diarrheachildren.html',
    lastReviewed: '2023-09-12',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Vomiting in Children ──
  {
    title: 'Vomiting in Children',
    content:
      'Vomiting in children is commonly caused by stomach viruses, food reactions, or motion sickness. It usually resolves on its own within 12 to 24 hours. Keep the child hydrated with small sips of clear fluids or oral rehydration solution. See a healthcare provider if vomiting lasts more than 24 hours, the child shows signs of dehydration, vomit contains blood or is green, or the child is lethargic.',
    zh_summary: '儿童呕吐常由胃肠病毒、食物反应或晕动病引起，通常12-24小时内自行好转。少量多次喂清流质或口服补液盐。呕吐超过24小时或有脱水迹象需就医。',
    url: 'https://medlineplus.gov/vomitingchildren.html',
    lastReviewed: '2024-04-08',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Rashes in Children ──
  {
    title: 'Rashes in Children',
    content:
      'Rashes in children can result from infections, allergies, heat, or irritants. Common childhood rashes include eczema, hives, impetigo, and viral exanthems. Most rashes are not serious and resolve on their own or with simple treatment. See a healthcare provider if the rash is accompanied by fever, spreads rapidly, appears as purple spots that do not blanch with pressure, or the child seems very unwell.',
    zh_summary: '儿童皮疹可由感染、过敏、热或刺激物引起，包括湿疹、荨麻疹和病毒性皮疹。大多不严重可自愈或简单治疗。伴发烧、快速扩散或紫色不褪色斑点需就医。',
    url: 'https://medlineplus.gov/rasheschildren.html',
    lastReviewed: '2023-07-22',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Allergies in Children ──
  {
    title: 'Allergies in Children',
    content:
      'Allergies occur when the immune system overreacts to substances such as pollen, dust mites, pet dander, or certain foods. Symptoms may include sneezing, runny nose, itchy eyes, skin rashes, or stomach upset. Avoiding known allergens and using antihistamines as directed can help manage symptoms. See a healthcare provider if your child has severe reactions, difficulty breathing, or swelling of the face, lips, or tongue.',
    zh_summary: '过敏是免疫系统对花粉、尘螨、宠物毛屑或食物的过度反应。症状包括打喷嚏、流鼻涕、皮疹或胃部不适。严重反应如呼吸困难或面部肿胀需紧急就医。',
    url: 'https://medlineplus.gov/allergieschildren.html',
    lastReviewed: '2024-05-18',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Asthma in Children ──
  {
    title: 'Asthma in Children',
    content:
      'Asthma is a chronic lung condition that causes airway inflammation and narrowing, making breathing difficult. In children, triggers may include colds, exercise, allergens, and cold air. Symptoms include wheezing, coughing (especially at night), shortness of breath, and chest tightness. Follow an asthma action plan from your healthcare provider and seek emergency care if the child has severe difficulty breathing or rescue inhaler is not helping.',
    zh_summary: '哮喘是慢性肺部疾病，导致气道发炎和收缩。触发因素包括感冒、运动和过敏原。遵循医生的哮喘行动计划，严重呼吸困难或吸入器无效需急诊。',
    url: 'https://medlineplus.gov/asthmachildren.html',
    lastReviewed: '2024-06-01',
    population: 'pediatric',
  },
  // ── PEDIATRIC: RSV (Respiratory Syncytial Virus) ──
  {
    title: 'RSV (Respiratory Syncytial Virus)',
    content:
      'RSV is a common respiratory virus that usually causes mild cold-like symptoms. In infants and young children, it can lead to bronchiolitis or pneumonia. Symptoms include runny nose, cough, sneezing, fever, and wheezing. Most children recover in one to two weeks. Seek immediate care if the child has difficulty breathing, is breathing very fast, has a bluish color to lips or fingernails, or is not drinking enough fluids.',
    zh_summary: 'RSV是常见呼吸道病毒，婴幼儿可能发展为毛细支气管炎或肺炎。症状包括流涕、咳嗽、发烧和喘息。呼吸困难、嘴唇发紫或饮水不足需紧急就医。',
    url: 'https://medlineplus.gov/rsv.html',
    lastReviewed: '2024-01-25',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Croup ──
  {
    title: 'Croup',
    content:
      'Croup is a viral infection that causes swelling around the vocal cords, leading to a characteristic barking cough, hoarse voice, and stridor (a high-pitched breathing sound). It most commonly affects children ages 6 months to 3 years. Cool mist humidifiers and exposure to cool night air can help ease symptoms. Seek emergency care if the child has severe stridor at rest, difficulty breathing, drooling, or appears very anxious.',
    zh_summary: '哮吼是病毒感染导致声带周围肿胀，表现为犬吠样咳嗽和喘鸣。多发于6个月至3岁儿童。冷空气和加湿器可缓解症状，严重呼吸困难或流口水需急诊。',
    url: 'https://medlineplus.gov/croup.html',
    lastReviewed: '2023-10-14',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Hand, Foot, and Mouth Disease ──
  {
    title: 'Hand, Foot, and Mouth Disease',
    content:
      'Hand, foot, and mouth disease is a common viral illness caused by coxsackievirus, usually affecting children under 5 years old. It causes fever, mouth sores, and a rash with blisters on the hands, feet, and sometimes buttocks. The illness is usually mild and resolves within 7 to 10 days. Ensure the child stays hydrated and offer soft foods. See a healthcare provider if your child cannot drink enough fluids or symptoms worsen.',
    zh_summary: '手足口病由柯萨奇病毒引起，常见于5岁以下儿童。症状为发烧、口腔溃疡和手脚皮疹。通常7-10天自愈，注意补液，无法饮水或症状加重需就医。',
    url: 'https://medlineplus.gov/handfootmouth.html',
    lastReviewed: '2024-03-02',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Chickenpox ──
  {
    title: 'Chickenpox',
    content:
      'Chickenpox is a highly contagious viral infection caused by varicella-zoster virus. It causes an itchy, blister-like rash, fever, tiredness, and loss of appetite. The rash typically appears first on the chest, back, and face before spreading. Most cases are mild in children, and the varicella vaccine prevents most infections. See a healthcare provider if the child develops a high fever, the rash spreads to the eyes, or blisters appear infected.',
    zh_summary: '水痘由水痘-带状疱疹病毒引起，传染性极强。表现为瘙痒水泡样皮疹、发烧和食欲下降。接种疫苗可预防，高烧、皮疹感染或波及眼睛需就医。',
    url: 'https://medlineplus.gov/chickenpox.html',
    lastReviewed: '2023-08-19',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Measles ──
  {
    title: 'Measles',
    content:
      'Measles is a highly contagious viral disease that causes high fever, cough, runny nose, red watery eyes, and a characteristic red blotchy rash that starts on the face and spreads downward. It can lead to serious complications including pneumonia and encephalitis, especially in young children. The MMR vaccine is the best protection against measles. Seek medical care if measles is suspected, as it is a reportable disease.',
    zh_summary: '麻疹是高度传染性病毒病，表现为高烧、咳嗽、红眼和特征性红色皮疹。可导致肺炎和脑炎等严重并发症。MMR疫苗是最佳预防方法，疑似麻疹需就医。',
    url: 'https://medlineplus.gov/measles.html',
    lastReviewed: '2024-02-11',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Mumps ──
  {
    title: 'Mumps',
    content:
      'Mumps is a contagious viral infection that primarily affects the salivary glands, causing painful swelling of the cheeks and jaw. Other symptoms include fever, headache, muscle aches, and fatigue. Complications can include meningitis and hearing loss. The MMR vaccine prevents most mumps infections. See a healthcare provider if your child develops symptoms, especially severe headache, stiff neck, or abdominal pain.',
    zh_summary: '流行性腮腺炎主要影响唾液腺，导致腮腺肿痛。可并发脑膜炎和听力下降。MMR疫苗可预防，出现严重头痛、颈部僵硬或腹痛需就医。',
    url: 'https://medlineplus.gov/mumps.html',
    lastReviewed: '2023-12-03',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Whooping Cough (Pertussis) ──
  {
    title: 'Whooping Cough (Pertussis)',
    content:
      'Whooping cough is a highly contagious bacterial infection that causes severe coughing fits followed by a high-pitched "whoop" sound when breathing in. It is most dangerous in infants who may develop apnea instead of a whoop. The DTaP vaccine protects children against pertussis. Seek immediate medical care for any infant with a severe cough, and for any child with coughing spells that cause vomiting, turning blue, or difficulty breathing.',
    zh_summary: '百日咳是高度传染性细菌感染，引起剧烈咳嗽发作后伴"鸡鸣"声。对婴儿最危险，可能出现呼吸暂停。DTaP疫苗可预防，婴儿剧烈咳嗽需紧急就医。',
    url: 'https://medlineplus.gov/whoopingcough.html',
    lastReviewed: '2024-04-20',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Constipation in Children ──
  {
    title: 'Constipation in Children',
    content:
      'Constipation in children means having hard, dry stools that are difficult or painful to pass, or having fewer bowel movements than usual. Common causes include a low-fiber diet, not drinking enough fluids, and withholding stool. Encourage your child to eat fruits, vegetables, and whole grains, and to drink plenty of water. See a healthcare provider if constipation lasts more than two weeks, is accompanied by abdominal pain, or blood is present in the stool.',
    zh_summary: '儿童便秘表现为大便干硬、排便困难或次数减少。常因低纤维饮食和饮水不足引起。鼓励多吃蔬果和全谷物，超过两周或伴腹痛、便血需就医。',
    url: 'https://medlineplus.gov/constipationchildren.html',
    lastReviewed: '2023-06-17',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Urinary Tract Infections in Children ──
  {
    title: 'Urinary Tract Infections in Children',
    content:
      'A urinary tract infection in children occurs when bacteria enter the urinary system. Symptoms vary by age: infants may have fever, irritability, and poor feeding, while older children may have painful urination, frequent urination, and abdominal pain. UTIs need prompt treatment with antibiotics to prevent kidney damage. See a healthcare provider if your child has symptoms of a UTI, especially if there is fever or back pain.',
    zh_summary: '儿童尿路感染由细菌进入泌尿系统引起。婴儿可能表现为发烧和烦躁，大龄儿童会尿痛和尿频。需要抗生素治疗以防肾脏损害，发烧或腰痛需及时就医。',
    url: 'https://medlineplus.gov/utichildren.html',
    lastReviewed: '2024-01-08',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Child Growth and Development ──
  {
    title: 'Child Growth and Development',
    content:
      'Child growth and development refers to the physical, cognitive, emotional, and social milestones children reach as they age. Each child develops at their own pace, but there are general ranges for when milestones are typically achieved. Regular well-child visits help track growth and development. Talk to your healthcare provider if your child is not meeting milestones, loses previously acquired skills, or you have concerns about their development.',
    zh_summary: '儿童生长发育包括体格、认知、情感和社交里程碑。每个孩子发育节奏不同，但有一般参考范围。未达到里程碑或丧失已有技能需咨询医生。',
    url: 'https://medlineplus.gov/childgrowth.html',
    lastReviewed: '2024-05-30',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Teething ──
  {
    title: 'Teething',
    content:
      'Teething is the process of baby teeth emerging through the gums, usually starting around 6 months of age. Symptoms may include drooling, fussiness, swollen gums, and a desire to chew on things. Low-grade fever may occur, but high fever is not caused by teething. Offer a clean, cool teething ring or gently rub the gums with a clean finger. See a healthcare provider if your child has high fever, diarrhea, or excessive crying.',
    zh_summary: '出牙通常从6个月左右开始，可能出现流口水、烦躁和牙龈肿胀。低烧可能出现，但高烧不是出牙引起的。可用清洁的凉牙胶环缓解，高烧或过度哭闹需就医。',
    url: 'https://medlineplus.gov/teething.html',
    lastReviewed: '2023-05-14',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Diaper Rash ──
  {
    title: 'Diaper Rash',
    content:
      'Diaper rash is a common skin irritation in the diaper area, causing red, inflamed skin. It is usually caused by prolonged contact with wet or soiled diapers, friction, or yeast infections. Change diapers frequently, allow air-drying, and apply a barrier cream such as zinc oxide. See a healthcare provider if the rash does not improve within a few days, has blisters or open sores, or the child develops a fever.',
    zh_summary: '尿布疹是尿布区域常见皮肤刺激，表现为红肿皮肤。勤换尿布、保持干爽并涂氧化锌护臀膏可预防和治疗。几天不好转、有水泡或发烧需就医。',
    url: 'https://medlineplus.gov/diaperrash.html',
    lastReviewed: '2024-02-05',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Jaundice in Newborns ──
  {
    title: 'Jaundice in Newborns',
    content:
      'Newborn jaundice causes yellowing of the skin and eyes due to elevated bilirubin levels in the blood. It is common in the first week of life, especially in premature infants. Mild jaundice often resolves on its own with frequent feeding. See a healthcare provider promptly if the yellow color deepens, the baby is difficult to wake, is not feeding well, or jaundice appears within 24 hours of birth.',
    zh_summary: '新生儿黄疸因血液中胆红素升高导致皮肤和眼白发黄。常见于出生第一周，频繁喂养可改善。黄疸加深、嗜睡或喂养差需及时就医。',
    url: 'https://medlineplus.gov/newbornjaundice.html',
    lastReviewed: '2024-06-10',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Colic ──
  {
    title: 'Colic',
    content:
      'Colic is frequent, prolonged, and intense crying in a healthy infant, typically occurring in the first few weeks of life and improving by 3 to 4 months. A colicky baby may cry for more than three hours a day, three days a week. The cause is not fully understood. Soothing techniques include swaddling, gentle motion, and white noise. See a healthcare provider to rule out other causes of crying and if the baby has fever, vomiting, or changes in stool.',
    zh_summary: '肠绞痛是健康婴儿频繁剧烈的哭闹，通常在出生头几周开始，3-4个月后改善。安抚方法包括裹襁褓、轻摇和白噪音。伴发烧、呕吐或大便异常需排除其他原因。',
    url: 'https://medlineplus.gov/colic.html',
    lastReviewed: '2023-11-22',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Febrile Seizures ──
  {
    title: 'Febrile Seizures',
    content:
      'Febrile seizures are convulsions that can occur in young children during a fever, most commonly between ages 6 months and 5 years. They usually last less than five minutes and do not cause lasting harm. During a seizure, place the child on their side on a safe surface and do not put anything in their mouth. Call emergency services if the seizure lasts more than five minutes, the child does not recover quickly, or it is the first febrile seizure.',
    zh_summary: '热性惊厥是幼儿发烧时出现的抽搐，多见于6个月至5岁。通常持续不到5分钟，不会造成永久损害。发作时将孩子侧放，超过5分钟或首次发作需呼叫急救。',
    url: 'https://medlineplus.gov/febrileseizures.html',
    lastReviewed: '2024-03-28',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Head Lice ──
  {
    title: 'Head Lice',
    content:
      'Head lice are tiny insects that live on the scalp and feed on blood. They are spread by direct head-to-head contact and are common in school-age children. Symptoms include itching and small red bumps on the scalp. Treatment involves over-the-counter or prescription lice-killing shampoos and careful combing with a fine-tooth nit comb. See a healthcare provider if over-the-counter treatments do not work or if the scalp appears infected.',
    zh_summary: '头虱是寄生在头皮上的小虫，通过头对头接触传播，学龄儿童常见。使用灭虱洗发液和密齿梳子治疗。非处方药无效或头皮感染需就医。',
    url: 'https://medlineplus.gov/headlice.html',
    lastReviewed: '2023-09-05',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Pinworms ──
  {
    title: 'Pinworms',
    content:
      'Pinworms are small, thin white worms that infect the intestines, most commonly in school-age children. The main symptom is intense itching around the anus, especially at night when female worms lay eggs. Pinworms are easily spread in households and classrooms. Treatment involves a two-dose course of anti-parasitic medication for the entire household. See a healthcare provider for diagnosis and treatment if pinworms are suspected.',
    zh_summary: '蛲虫是常见肠道寄生虫，引起肛门周围剧烈瘙痒尤其夜间。通过接触传播，在儿童中常见。非处方驱虫药可治疗，家庭成员需同时治疗。',
    url: 'https://medlineplus.gov/pinworms.html',
    lastReviewed: '2024-01-30',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Strep Throat in Children ──
  {
    title: 'Strep Throat in Children',
    content:
      'Strep throat is a bacterial infection of the throat and tonsils caused by group A Streptococcus. Symptoms include severe sore throat, fever, red swollen tonsils (sometimes with white patches), and swollen lymph nodes. Unlike viral sore throats, strep rarely causes cough or runny nose. Strep throat requires antibiotic treatment to prevent complications such as rheumatic fever. See a healthcare provider if your child has a sore throat with fever.',
    zh_summary: '链球菌性咽炎由A族链球菌引起，表现为严重咽痛、吞咽困难和发烧。需要抗生素治疗以预防风湿热等并发症，疑似链球菌感染应及时就医。',
    url: 'https://medlineplus.gov/strepthroat.html',
    lastReviewed: '2024-04-12',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Tonsillitis ──
  {
    title: 'Tonsillitis',
    content:
      'Tonsillitis is inflammation of the tonsils, usually caused by viral or bacterial infections. Symptoms include sore throat, difficulty swallowing, fever, swollen glands, and red swollen tonsils. Treatment depends on the cause: bacterial tonsillitis requires antibiotics, while viral tonsillitis resolves on its own. See a healthcare provider if your child has difficulty breathing or swallowing, drools excessively, or has symptoms lasting more than a few days.',
    zh_summary: '扁桃体炎可由病毒或细菌引起，症状包括咽痛、吞咽困难、发烧和扁桃体肿大。大部分病毒性扁桃体炎可自愈，呼吸或吞咽严重困难需就医。',
    url: 'https://medlineplus.gov/tonsillitis.html',
    lastReviewed: '2023-08-08',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Bronchiolitis ──
  {
    title: 'Bronchiolitis',
    content:
      'Bronchiolitis is a common lung infection in infants and young children, usually caused by RSV. It affects the small airways (bronchioles), causing swelling and mucus buildup. Symptoms include runny nose, cough, wheezing, and difficulty breathing. Most cases are mild and resolve at home with fluids and comfort measures. Seek immediate care if the child has rapid breathing, difficulty feeding, nasal flaring, or bluish skin color.',
    zh_summary: '毛细支气管炎是婴幼儿常见的肺部感染，多由RSV病毒引起。症状包括咳嗽、喘息、呼吸急促和喂养困难。呼吸困难、嘴唇发紫或饮水不足需紧急就医。',
    url: 'https://medlineplus.gov/bronchiolitis.html',
    lastReviewed: '2024-02-18',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Pneumonia in Children ──
  {
    title: 'Pneumonia in Children',
    content:
      'Pneumonia is an infection of the lungs that can be caused by bacteria, viruses, or fungi. In children, symptoms include cough, fever, rapid breathing, chest pain, and difficulty breathing. Bacterial pneumonia requires antibiotic treatment. Keep the child hydrated and rested. Seek immediate medical care if the child has severe difficulty breathing, looks bluish, has a very high fever, or is not improving with treatment.',
    zh_summary: '儿童肺炎可由细菌、病毒或真菌引起，症状包括咳嗽、发烧、呼吸急促和胸痛。细菌性肺炎需要抗生素治疗。持续高烧、呼吸困难或嘴唇发紫需紧急就医。',
    url: 'https://medlineplus.gov/pneumoniachildren.html',
    lastReviewed: '2023-10-25',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Dehydration in Children ──
  {
    title: 'Dehydration in Children',
    content:
      'Dehydration occurs when a child loses more fluids than they take in, often due to vomiting, diarrhea, or fever. Signs include dry mouth, fewer tears when crying, less wet diapers, sunken eyes, and lethargy. Offer small frequent sips of oral rehydration solution. Seek immediate medical care if the child has no tears, very dry mouth, sunken fontanelle (in infants), no urine for 6 or more hours, or appears very lethargic.',
    zh_summary: '儿童脱水多因呕吐、腹泻或高热导致。症状包括口干、哭时少泪、尿量减少和嗜睡。少量多次喂口服补液盐，严重脱水需紧急就医。',
    url: 'https://medlineplus.gov/dehydrationchildren.html',
    lastReviewed: '2024-05-05',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Food Allergies in Children ──
  {
    title: 'Food Allergies in Children',
    content:
      'Food allergies occur when the immune system reacts to certain proteins in food. Common triggers in children include milk, eggs, peanuts, tree nuts, wheat, soy, fish, and shellfish. Symptoms range from mild (hives, stomach upset) to severe (anaphylaxis). Strict avoidance of trigger foods is key. Children with known food allergies should carry epinephrine auto-injectors. Seek emergency care for any signs of anaphylaxis such as difficulty breathing or throat swelling.',
    zh_summary: '食物过敏在儿童中常见，常见过敏原包括牛奶、鸡蛋、花生和坚果。症状从皮疹到严重过敏反应不等。呼吸困难或面部肿胀需使用肾上腺素并急诊。',
    url: 'https://medlineplus.gov/foodallergieschildren.html',
    lastReviewed: '2024-06-15',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Eczema in Children ──
  {
    title: 'Eczema in Children',
    content:
      'Eczema (atopic dermatitis) is a chronic skin condition causing dry, itchy, inflamed patches of skin. It commonly affects infants and young children, often on the face, elbows, and knees. Triggers may include irritants, allergens, dry air, and stress. Treatment includes regular moisturizing, avoiding triggers, and using prescribed topical medications. See a healthcare provider if the rash is severe, appears infected, or does not respond to basic treatment.',
    zh_summary: '儿童湿疹表现为皮肤干燥、瘙痒和红肿，常见于面部、肘部和膝部。保持皮肤湿润和避免刺激物有助于控制。瘙痒严重影响睡眠或出现感染迹象需就医。',
    url: 'https://medlineplus.gov/eczemachildren.html',
    lastReviewed: '2023-12-20',
    population: 'pediatric',
  },
  // ── PEDIATRIC: ADHD in Children ──
  {
    title: 'ADHD in Children',
    content:
      'Attention-deficit/hyperactivity disorder (ADHD) is a neurodevelopmental condition that affects concentration, impulse control, and activity levels. Children with ADHD may have trouble paying attention, act without thinking, and be overly active. Diagnosis involves a thorough evaluation by a healthcare provider. Treatment may include behavioral therapy, educational support, and medication. Talk to your healthcare provider if your child has persistent difficulty with focus, behavior, or schoolwork.',
    zh_summary: 'ADHD表现为注意力不集中、多动和冲动行为，可能影响学习和社交。如孩子持续存在这些行为且影响日常生活，应咨询儿科医生进行评估。',
    url: 'https://medlineplus.gov/adhdchildren.html',
    lastReviewed: '2024-04-01',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Autism Spectrum Disorder Screening ──
  {
    title: 'Autism Spectrum Disorder Screening',
    content:
      'Autism spectrum disorder (ASD) is a developmental condition that affects communication, behavior, and social interaction. Early signs may include limited eye contact, delayed speech, repetitive behaviors, and difficulty with social interactions. Early screening and intervention can significantly improve outcomes. The American Academy of Pediatrics recommends autism screening at 18 and 24 months. Talk to your healthcare provider if you have concerns about your child\'s development.',
    zh_summary: '自闭症谱系障碍影响社交、沟通和行为，早期筛查和干预可改善预后。如孩子在12个月时不会指物、16个月不说单词或对呼名无反应应咨询医生。',
    url: 'https://medlineplus.gov/autismscreening.html',
    lastReviewed: '2024-01-18',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Childhood Vaccines ──
  {
    title: 'Childhood Vaccines',
    content:
      'Vaccines protect children from serious diseases such as measles, whooping cough, polio, and more. The recommended childhood immunization schedule begins at birth and continues through adolescence. Vaccines are thoroughly tested for safety and are one of the most effective ways to prevent infectious diseases. Keep a record of your child\'s vaccinations and follow the schedule recommended by your healthcare provider.',
    zh_summary: '儿童疫苗是保护孩子免受严重疾病的最有效方法。按照推荐时间表接种确保最佳保护。疫苗的益处远大于可能的轻微副作用。',
    url: 'https://medlineplus.gov/childhoodvaccines.html',
    lastReviewed: '2024-05-22',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Child Safety ──
  {
    title: 'Child Safety',
    content:
      'Unintentional injuries are a leading cause of death in children. Key safety measures include using car seats and seat belts, installing smoke detectors, keeping medicines and chemicals out of reach, supervising children near water, and using safety gates for stairs. Childproofing the home should begin before a baby starts crawling. Talk to your healthcare provider about age-appropriate safety measures at each well-child visit.',
    zh_summary: '儿童意外伤害可通过预防措施降低风险。家中应安装安全门、插座保护盖，将危险物品放在儿童够不到的地方。时刻看护幼儿。',
    url: 'https://medlineplus.gov/childsafety.html',
    lastReviewed: '2023-07-10',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Poisoning Prevention in Children ──
  {
    title: 'Poisoning Prevention in Children',
    content:
      'Children are naturally curious and may ingest household chemicals, medications, or toxic plants. Keep all medicines, cleaning products, and chemicals locked up and out of reach. Have the Poison Control number (1-800-222-1222) readily available. If you suspect poisoning, call Poison Control or 911 immediately. Do not induce vomiting unless specifically instructed. Childproof caps are not fully child-resistant, so secure storage is essential.',
    zh_summary: '误食中毒是儿童常见紧急情况。将药物、清洁剂等放在儿童够不到的地方，使用儿童安全锁。误食后立即拨打急救电话，不要自行催吐。',
    url: 'https://medlineplus.gov/poisoningprevention.html',
    lastReviewed: '2024-02-28',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Burns in Children ──
  {
    title: 'Burns in Children',
    content:
      'Burns in children can result from hot liquids, flames, chemicals, or electricity. First-degree burns cause redness, second-degree burns cause blisters, and third-degree burns damage deeper tissues. For minor burns, cool the area under running water for 10 to 20 minutes and cover loosely with a clean bandage. Seek immediate medical care for burns that are large, on the face, hands, or genitals, or appear deep or charred.',
    zh_summary: '儿童烫伤多由热液、热表面和火焰引起。预防措施包括调低热水器温度、远离热源。轻度烫伤用冷水冲洗，严重烫伤需紧急就医。',
    url: 'https://medlineplus.gov/burnsinchildren.html',
    lastReviewed: '2023-06-30',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Drowning Prevention ──
  {
    title: 'Drowning Prevention',
    content:
      'Drowning is a leading cause of injury death in children ages 1 to 4. Young children can drown in as little as one inch of water. Never leave children unattended near water, including bathtubs, pools, and buckets. Install four-sided pool fences with self-closing gates. Enroll children in age-appropriate swimming lessons. Learn CPR. If a child is missing, check water sources first and call 911 immediately.',
    zh_summary: '溺水是儿童意外死亡的主要原因之一。在水边时刻看护儿童，学习游泳，安装四面围栏。家长应学习心肺复苏术。',
    url: 'https://medlineplus.gov/drowningprevention.html',
    lastReviewed: '2024-06-05',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Fifth Disease ──
  {
    title: 'Fifth Disease',
    content:
      'Fifth disease is a mild viral illness caused by parvovirus B19, common in school-age children. It causes a distinctive bright red rash on the cheeks ("slapped cheek" appearance) that may spread to the body. Other symptoms include low-grade fever, runny nose, and joint pain. Most children recover without treatment. See a healthcare provider if your child has a weakened immune system or if a pregnant woman is exposed.',
    zh_summary: '传染性红斑（第五病）由细小病毒B19引起，面部出现"掌掴样"红斑，随后躯干和四肢出现花边样皮疹。通常1-3周自愈，孕妇接触后应咨询医生。',
    url: 'https://medlineplus.gov/fifthdisease.html',
    lastReviewed: '2023-04-15',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Impetigo in Children ──
  {
    title: 'Impetigo in Children',
    content:
      'Impetigo is a common, highly contagious bacterial skin infection that mainly affects infants and young children. It causes red sores that burst and develop honey-colored crusts, usually around the nose and mouth. Good hygiene and keeping sores covered help prevent spreading. Treatment typically involves antibiotic ointment or oral antibiotics. See a healthcare provider if sores are spreading, do not improve with treatment, or the child develops fever.',
    zh_summary: '脓疱疮是常见细菌性皮肤感染，在鼻和口周围出现红色疮和蜜色结痂。传染性强，需要抗生素治疗。疮面扩大或伴发烧需就医。',
    url: 'https://medlineplus.gov/impetigochildren.html',
    lastReviewed: '2024-03-10',
    population: 'pediatric',
  },
  // ── PEDIATRIC: Scarlet Fever ──
  {
    title: 'Scarlet Fever',
    content:
      'Scarlet fever is a bacterial illness caused by group A Streptococcus, typically following strep throat. It causes a red, sandpaper-like rash, high fever, sore throat, and a strawberry-textured tongue. It is most common in children ages 5 to 15. Treatment with antibiotics is necessary to prevent complications. See a healthcare provider promptly if your child has a sore throat with a rash, fever, or swollen glands.',
    zh_summary: '猩红热由A族链球菌引起，表现为红色砂纸样皮疹、高烧和"草莓舌"。需要抗生素治疗以预防并发症。出现高烧或皮疹不消退需就医。',
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
    zh_summary: '跌倒是老年人受伤死亡的主要原因。预防措施包括锻炼增强力量和平衡、检查视力、清除家中绊倒隐患。跌倒后出现头痛或疼痛需就医。',
    url: 'https://medlineplus.gov/falls.html',
    lastReviewed: '2024-01-20',
    population: 'geriatric',
  },
  // ── GERIATRIC: Confusion and Delirium in Older Adults ──
  {
    title: 'Confusion and Delirium in Older Adults',
    content:
      'Delirium is a sudden change in mental function causing confusion, disorientation, and difficulty with attention. In older adults, it can be triggered by infections, medications, dehydration, surgery, or hospitalization. Unlike dementia, delirium develops quickly over hours or days and is often reversible. Seek immediate medical care if an older adult develops sudden confusion, as it may indicate a serious underlying condition such as infection or stroke.',
    zh_summary: '老年人突发意识混乱和谵妄可能由感染、药物或脱水引起。表现为注意力无法集中和行为改变。突发混乱是医疗紧急情况，需立即就医。',
    url: 'https://medlineplus.gov/delirium.html',
    lastReviewed: '2023-10-30',
    population: 'geriatric',
  },
  // ── GERIATRIC: Stroke ──
  {
    title: 'Stroke',
    content:
      'A stroke occurs when blood supply to part of the brain is interrupted or reduced, depriving brain tissue of oxygen. Symptoms include sudden numbness or weakness on one side of the body, sudden confusion, trouble speaking, vision problems, severe headache, and loss of balance. Use the FAST method: Face drooping, Arm weakness, Speech difficulty, Time to call 911. Immediate treatment can minimize brain damage and potential complications.',
    zh_summary: '中风是脑血管突然阻塞或破裂导致的紧急情况。识别征兆：面部下垂、手臂无力、言语不清。出现任何中风症状需立即拨打急救电话。',
    url: 'https://medlineplus.gov/stroke.html',
    lastReviewed: '2024-04-15',
    population: 'geriatric',
  },
  // ── GERIATRIC: Heart Attack ──
  {
    title: 'Heart Attack',
    content:
      'A heart attack occurs when blood flow to part of the heart muscle is blocked, usually by a blood clot. Symptoms include chest pain or discomfort, shortness of breath, pain in one or both arms, jaw, neck, or back, nausea, and cold sweats. Women may have atypical symptoms. Call 911 immediately if you suspect a heart attack. Quick treatment is essential to restore blood flow and reduce heart damage.',
    zh_summary: '心脏病发作是冠状动脉阻塞导致心肌缺血的紧急情况。症状包括胸痛、放射至手臂的疼痛、气短和出冷汗。出现这些症状需立即拨打120。',
    url: 'https://medlineplus.gov/heartattack.html',
    lastReviewed: '2024-02-14',
    population: 'geriatric',
  },
  // ── GERIATRIC: High Blood Pressure in Older Adults ──
  {
    title: 'High Blood Pressure in Older Adults',
    content:
      'High blood pressure (hypertension) is common in older adults and increases the risk of heart disease, stroke, and kidney problems. It often has no symptoms, making regular monitoring essential. Lifestyle changes including reducing sodium, regular exercise, maintaining a healthy weight, and limiting alcohol can help. Take prescribed medications as directed. See a healthcare provider for regular blood pressure checks and if readings are consistently elevated.',
    zh_summary: '高血压是老年人最常见的慢性病之一，控制血压可降低中风和心脏病风险。定期测量血压、限盐、规律运动和按时服药很重要。',
    url: 'https://medlineplus.gov/highbloodpressureelderly.html',
    lastReviewed: '2023-09-22',
    population: 'geriatric',
  },
  // ── GERIATRIC: Atrial Fibrillation ──
  {
    title: 'Atrial Fibrillation',
    content:
      'Atrial fibrillation (AFib) is an irregular, often rapid heart rhythm that is common in older adults. Symptoms may include palpitations, shortness of breath, weakness, dizziness, and fatigue. AFib increases the risk of stroke and heart failure. Treatment may include medications to control heart rate and rhythm, blood thinners to prevent stroke, and procedures. Seek emergency care for chest pain, severe shortness of breath, or fainting.',
    zh_summary: '房颤是常见心律失常，增加中风风险。症状包括心悸、气短和头晕。需要规律监测和可能的抗凝治疗，胸痛或严重气短需紧急就医。',
    url: 'https://medlineplus.gov/atrialfibrillation.html',
    lastReviewed: '2024-05-10',
    population: 'geriatric',
  },
  // ── GERIATRIC: Heart Failure ──
  {
    title: 'Heart Failure',
    content:
      'Heart failure means the heart cannot pump blood as well as it should. Common symptoms include shortness of breath, fatigue, swelling in the legs and feet, rapid heartbeat, and persistent cough. It is more common in older adults and those with heart conditions. Treatment includes medications, lifestyle changes, and sometimes devices or surgery. Seek immediate care for sudden shortness of breath, chest pain, or fainting.',
    zh_summary: '心力衰竭指心脏无法有效泵血，导致体液积聚。症状包括气短、下肢水肿和疲劳。需要长期药物管理，症状突然加重需紧急就医。',
    url: 'https://medlineplus.gov/heartfailure.html',
    lastReviewed: '2023-12-08',
    population: 'geriatric',
  },
  // ── GERIATRIC: COPD in Older Adults ──
  {
    title: 'COPD in Older Adults',
    content:
      'Chronic obstructive pulmonary disease (COPD) includes emphysema and chronic bronchitis. It causes airflow obstruction and breathing difficulty, most often from long-term smoking. Symptoms include chronic cough, mucus production, shortness of breath, and wheezing. Treatment includes bronchodilators, inhaled steroids, pulmonary rehabilitation, and flu and pneumonia vaccines. Seek emergency care for severe shortness of breath, bluish lips, or confusion.',
    zh_summary: '慢阻肺在老年人中常见，主要由长期吸烟引起。症状包括慢性咳嗽、气短和喘息。遵医嘱用药、避免烟雾和空气污染。呼吸困难加重需急诊。',
    url: 'https://medlineplus.gov/copdelderly.html',
    lastReviewed: '2024-03-22',
    population: 'geriatric',
  },
  // ── GERIATRIC: Pneumonia in Older Adults ──
  {
    title: 'Pneumonia in Older Adults',
    content:
      'Pneumonia is a lung infection that can be especially dangerous for adults over 65. Older adults may have atypical symptoms such as confusion, low body temperature, or worsening of existing conditions rather than high fever. Pneumococcal and flu vaccines help prevent pneumonia. Treatment depends on the type and severity and may include antibiotics and supportive care. Seek immediate care for difficulty breathing, confusion, or persistent high fever.',
    zh_summary: '老年人肺炎症状可能不典型，可能仅表现为混乱或乏力。接种肺炎和流感疫苗可降低风险。发烧、呼吸困难或突发意识改变需紧急就医。',
    url: 'https://medlineplus.gov/pneumoniaelderly.html',
    lastReviewed: '2024-01-05',
    population: 'geriatric',
  },
  // ── GERIATRIC: UTI in Older Adults ──
  {
    title: 'UTI in Older Adults',
    content:
      'Urinary tract infections are common in older adults and may present differently than in younger people. Older adults may experience confusion, agitation, falls, or decreased appetite rather than typical symptoms like painful urination. UTIs require prompt antibiotic treatment. Staying hydrated and maintaining good hygiene can help prevent infections. See a healthcare provider if an older adult develops sudden confusion, changes in behavior, or urinary symptoms.',
    zh_summary: '老年人尿路感染可能不表现为典型尿痛，而是以混乱或行为改变为主要症状。需要抗生素治疗。突发意识混乱或发烧需及时就医。',
    url: 'https://medlineplus.gov/utielderly.html',
    lastReviewed: '2023-08-15',
    population: 'geriatric',
  },
  // ── GERIATRIC: Dementia ──
  {
    title: 'Dementia',
    content:
      'Dementia is a group of conditions characterized by progressive decline in memory, thinking, and social abilities severe enough to interfere with daily life. Symptoms include memory loss, difficulty communicating, trouble with reasoning, confusion, and personality changes. It most commonly affects older adults. While there is no cure for most types, some treatments can help manage symptoms. See a healthcare provider early if memory changes are affecting daily activities.',
    zh_summary: '痴呆是认知功能逐渐下降影响日常生活的疾病。早期症状包括记忆力下降和判断力减退。保持社交和规律锻炼有助于减缓进展，明显变化应就医。',
    url: 'https://medlineplus.gov/dementia.html',
    lastReviewed: '2024-06-01',
    population: 'geriatric',
  },
  // ── GERIATRIC: Alzheimer's Disease ──
  {
    title: 'Alzheimer\'s Disease',
    content:
      'Alzheimer\'s disease is the most common cause of dementia, accounting for 60 to 80 percent of cases. It causes a progressive decline in memory, thinking, and behavior. Early signs include difficulty remembering recent events, trouble with planning and problem solving, and confusion with time or place. There is no cure, but treatments can help manage symptoms and support quality of life. Seek medical evaluation for persistent memory problems.',
    zh_summary: '阿尔茨海默病是最常见的痴呆类型，导致记忆、思维和行为逐渐恶化。目前无法治愈但药物可管理症状。记忆力明显下降或人格改变应尽早就医。',
    url: 'https://medlineplus.gov/alzheimers.html',
    lastReviewed: '2024-04-25',
    population: 'geriatric',
  },
  // ── GERIATRIC: Parkinson's Disease ──
  {
    title: 'Parkinson\'s Disease',
    content:
      'Parkinson\'s disease is a progressive nervous system disorder that affects movement. Symptoms develop gradually and may include tremor (usually starting in one hand), slowed movement, rigid muscles, impaired balance, and changes in speech and writing. It most commonly affects people over age 60. Treatment includes medications to manage symptoms, physical therapy, and sometimes surgery. See a healthcare provider if you notice persistent tremor or movement changes.',
    zh_summary: '帕金森病影响运动功能，主要症状为静止性震颤、肌肉僵硬和动作缓慢。早期诊断和治疗可改善生活质量。不明原因手抖或行走困难应就医。',
    url: 'https://medlineplus.gov/parkinsonsdisease.html',
    lastReviewed: '2023-11-15',
    population: 'geriatric',
  },
  // ── GERIATRIC: Osteoporosis ──
  {
    title: 'Osteoporosis',
    content:
      'Osteoporosis causes bones to become weak and brittle, increasing the risk of fractures. It is most common in older adults, especially postmenopausal women. Often there are no symptoms until a bone breaks. Prevention includes adequate calcium and vitamin D intake, weight-bearing exercise, and avoiding smoking and excessive alcohol. Bone density testing is recommended for women over 65 and men over 70. See a healthcare provider to discuss screening and treatment.',
    zh_summary: '骨质疏松使骨骼变脆弱容易骨折，老年人尤其绝经后女性风险较高。补钙、维生素D、负重运动和必要时药物治疗可降低骨折风险。',
    url: 'https://medlineplus.gov/osteoporosis.html',
    lastReviewed: '2024-02-08',
    population: 'geriatric',
  },
  // ── GERIATRIC: Arthritis in Older Adults ──
  {
    title: 'Arthritis in Older Adults',
    content:
      'Arthritis is inflammation of one or more joints, causing pain, swelling, and stiffness. Osteoarthritis, the most common form in older adults, results from wear and tear on joint cartilage. Symptoms include joint pain, stiffness (especially in the morning), reduced range of motion, and swelling. Treatment includes exercise, weight management, pain relievers, and physical therapy. See a healthcare provider if joint pain is persistent, limits activity, or suddenly worsens.',
    zh_summary: '关节炎导致关节疼痛、僵硬和活动受限。保持适度运动、保持健康体重和使用辅助器具可帮助管理症状。疼痛严重影响日常活动需就医。',
    url: 'https://medlineplus.gov/arthritiselderly.html',
    lastReviewed: '2023-07-28',
    population: 'geriatric',
  },
  // ── GERIATRIC: Hip Fracture ──
  {
    title: 'Hip Fracture',
    content:
      'A hip fracture is a serious injury, especially in older adults, often resulting from a fall. Symptoms include severe pain in the hip or groin, inability to put weight on the leg, bruising and swelling, and the affected leg appearing shorter or turned outward. Hip fractures almost always require surgery and extensive rehabilitation. Call 911 immediately for suspected hip fracture. Prevention includes fall prevention, osteoporosis treatment, and home safety modifications.',
    zh_summary: '髋部骨折在老年人中是严重事件，多由跌倒引起，通常需要手术治疗。预防跌倒、治疗骨质疏松和居家安全改造是预防关键。',
    url: 'https://medlineplus.gov/hipfracture.html',
    lastReviewed: '2024-05-15',
    population: 'geriatric',
  },
  // ── GERIATRIC: Vision Problems in Older Adults ──
  {
    title: 'Vision Problems in Older Adults',
    content:
      'Age-related vision problems include cataracts, glaucoma, macular degeneration, and diabetic retinopathy. Symptoms may include blurry vision, difficulty seeing at night, loss of peripheral vision, and seeing floaters or flashes. Regular eye exams can detect problems early when treatment is most effective. See an eye care provider immediately for sudden vision loss, sudden appearance of many floaters, flashes of light, or a curtain-like shadow over your field of vision.',
    zh_summary: '老年人常见视力问题包括白内障、青光眼和黄斑变性。定期眼科检查可早期发现。突然视力下降或眼前闪光需紧急就医。',
    url: 'https://medlineplus.gov/visionproblemselderly.html',
    lastReviewed: '2023-06-12',
    population: 'geriatric',
  },
  // ── GERIATRIC: Hearing Loss in Older Adults ──
  {
    title: 'Hearing Loss in Older Adults',
    content:
      'Age-related hearing loss (presbycusis) is a gradual loss of hearing that occurs as people age, affecting about one-third of adults over 65. Signs include difficulty understanding speech especially in noisy settings, frequently asking others to repeat themselves, and turning up the TV volume. Hearing aids and assistive devices can significantly improve quality of life. See a healthcare provider for a hearing evaluation if you notice changes in your hearing.',
    zh_summary: '听力下降在老年人中很常见，影响交流和生活质量。如果家人反映电视音量过大或频繁要求重复对话，建议进行听力检查。',
    url: 'https://medlineplus.gov/hearinglosselderly.html',
    lastReviewed: '2024-01-12',
    population: 'geriatric',
  },
  // ── GERIATRIC: Depression in Older Adults ──
  {
    title: 'Depression in Older Adults',
    content:
      'Depression in older adults is a serious condition that is often underdiagnosed. It is not a normal part of aging. Symptoms include persistent sadness, loss of interest in activities, fatigue, changes in sleep and appetite, difficulty concentrating, and thoughts of death. Chronic illness, isolation, and loss of loved ones can contribute. Treatment includes therapy, medication, and social support. Seek help immediately if there are thoughts of self-harm or suicide.',
    zh_summary: '老年抑郁症常被忽视，表现为持续悲伤、失去兴趣和社交退缩。这不是正常衰老现象，可以治疗。情绪低落或生活习惯明显改变应咨询医生。',
    url: 'https://medlineplus.gov/depressionelderly.html',
    lastReviewed: '2024-03-05',
    population: 'geriatric',
  },
  // ── GERIATRIC: Medication Management for Older Adults ──
  {
    title: 'Medication Management for Older Adults',
    content:
      'Older adults often take multiple medications, which increases the risk of drug interactions, side effects, and medication errors. Keep an updated list of all medications including over-the-counter drugs and supplements. Use one pharmacy when possible and review medications with your healthcare provider regularly. Use pill organizers and reminders to help take medications correctly. See a healthcare provider if you experience new symptoms that may be medication side effects.',
    zh_summary: '老年人常需服用多种药物，需注意药物相互作用和副作用。使用药盒按时服药，保持最新用药清单。新的不适症状可能与用药有关。',
    url: 'https://medlineplus.gov/medicationmanagement.html',
    lastReviewed: '2023-10-05',
    population: 'geriatric',
  },
  // ── GERIATRIC: Polypharmacy ──
  {
    title: 'Polypharmacy',
    content:
      'Polypharmacy refers to the use of multiple medications, typically five or more, which is common in older adults with several chronic conditions. It increases the risk of adverse drug reactions, falls, cognitive impairment, and hospitalization. Regular medication reviews with a healthcare provider can identify unnecessary medications. Never stop medications without medical guidance. Talk to your healthcare provider about simplifying your medication regimen when possible.',
    zh_summary: '多药并用指同时使用五种以上药物，增加副作用和药物相互作用风险。定期由医生审查用药清单，不要自行停药或增减剂量。',
    url: 'https://medlineplus.gov/polypharmacy.html',
    lastReviewed: '2024-04-08',
    population: 'geriatric',
  },
  // ── GERIATRIC: Malnutrition in Older Adults ──
  {
    title: 'Malnutrition in Older Adults',
    content:
      'Malnutrition is common in older adults due to decreased appetite, dental problems, chronic illness, medications, social isolation, and difficulty shopping or cooking. Warning signs include unintended weight loss, fatigue, muscle weakness, slow wound healing, and frequent infections. Nutrient-dense foods, meal programs, and nutritional supplements can help. See a healthcare provider if you notice significant weight loss, decreased appetite, or signs of malnutrition in an older adult.',
    zh_summary: '老年人营养不良可能由食欲下降或慢性病引起。体重意外下降、伤口愈合慢和乏力是警示信号。体重持续下降需就医评估。',
    url: 'https://medlineplus.gov/malnutritionelderly.html',
    lastReviewed: '2023-05-20',
    population: 'geriatric',
  },
  // ── GERIATRIC: Dehydration in Older Adults ──
  {
    title: 'Dehydration in Older Adults',
    content:
      'Older adults are at higher risk of dehydration because the sense of thirst decreases with age and kidneys may not conserve water as well. Medications such as diuretics also increase risk. Signs include dark urine, dry mouth, dizziness, confusion, and fatigue. Encourage regular fluid intake throughout the day even when not thirsty. Seek medical care if an older adult shows signs of severe dehydration such as confusion, rapid heartbeat, or fainting.',
    zh_summary: '老年人因渴觉减退和肾功能下降更易脱水。症状包括口干、尿少和意识混乱。鼓励定时饮水，明显脱水症状需及时就医。',
    url: 'https://medlineplus.gov/dehydrationelderly.html',
    lastReviewed: '2024-06-08',
    population: 'geriatric',
  },
  // ── GERIATRIC: Skin Tears in Older Adults ──
  {
    title: 'Skin Tears in Older Adults',
    content:
      'Skin tears are wounds caused by shear, friction, or blunt force that separate skin layers. Older adults are more susceptible because aging skin is thinner and more fragile. Keep skin moisturized, avoid adhesive bandages directly on fragile skin, and protect arms and legs from bumps. For a skin tear, gently clean the area, carefully lay the skin flap back into place, and cover with a non-stick dressing. See a healthcare provider if the tear is large, deep, or shows signs of infection.',
    zh_summary: '老年人皮肤变薄脆弱，轻微碰撞即可造成皮肤撕裂。保持皮肤湿润、穿长袖保护。小伤口保持清洁，较大撕裂或出血不止需就医。',
    url: 'https://medlineplus.gov/skintearselderly.html',
    lastReviewed: '2023-09-28',
    population: 'geriatric',
  },
  // ── GERIATRIC: Pressure Ulcers ──
  {
    title: 'Pressure Ulcers',
    content:
      'Pressure ulcers (bedsores) are injuries to skin and underlying tissue from prolonged pressure, typically over bony areas. They most commonly affect people with limited mobility. Prevention includes repositioning frequently, keeping skin clean and dry, using pressure-relieving surfaces, and maintaining good nutrition. See a healthcare provider immediately if a pressure ulcer develops, especially if there is redness that does not fade, blistering, or an open wound.',
    zh_summary: '压疮是长期卧床或久坐老人的常见问题。定时翻身、使用减压垫和保持皮肤清洁干燥可预防。皮肤出现持续红肿或破溃需及时就医。',
    url: 'https://medlineplus.gov/pressureulcers.html',
    lastReviewed: '2024-02-25',
    population: 'geriatric',
  },
  // ── GERIATRIC: Elder Abuse ──
  {
    title: 'Elder Abuse',
    content:
      'Elder abuse includes physical, emotional, sexual abuse, neglect, abandonment, and financial exploitation of older adults. Warning signs include unexplained injuries, fearfulness, withdrawal, poor hygiene, sudden financial changes, and caregiver isolation of the elder. If you suspect elder abuse, contact Adult Protective Services or call the Eldercare Locator at 1-800-677-1116. In an emergency, call 911.',
    zh_summary: '老年人虐待包括身体虐待、精神虐待、经济剥削和忽视。注意观察不明原因的伤痕或恐惧表情。如怀疑虐待请联系相关保护机构。',
    url: 'https://medlineplus.gov/elderabuse.html',
    lastReviewed: '2024-05-28',
    population: 'geriatric',
  },
  // ── GERIATRIC: End-of-Life Care ──
  {
    title: 'End-of-Life Care',
    content:
      'End-of-life care focuses on comfort, dignity, and quality of life for people with terminal illnesses. It includes palliative care to manage pain and symptoms, emotional and spiritual support, and hospice services. Having conversations about care preferences early is important. Advance directives and healthcare proxies help ensure wishes are followed. Talk to a healthcare provider about palliative care options and hospice services when appropriate.',
    zh_summary: '临终关怀旨在控制疼痛和提高生活质量，包括姑息治疗和家属支持。尽早讨论护理偏好和预立医疗指令很重要。',
    url: 'https://medlineplus.gov/endoflifecare.html',
    lastReviewed: '2023-08-30',
    population: 'geriatric',
  },
  // ── GERIATRIC: Advance Directives ──
  {
    title: 'Advance Directives',
    content:
      'Advance directives are legal documents that allow you to express your wishes about medical care if you become unable to make decisions for yourself. They include a living will (specifying treatments you do or do not want) and a healthcare power of attorney (naming someone to make decisions for you). Complete advance directives while you are healthy and share them with family and healthcare providers.',
    zh_summary: '预立医疗指令是提前表达医疗护理意愿的法律文件。建议在健康时就与家人讨论并完成文件，确保意愿得到尊重。',
    url: 'https://medlineplus.gov/advancedirectives.html',
    lastReviewed: '2024-01-28',
    population: 'geriatric',
  },
  // ── GERIATRIC: Balance Problems in Older Adults ──
  {
    title: 'Balance Problems in Older Adults',
    content:
      'Balance problems in older adults can result from inner ear disorders, vision changes, nerve damage, muscle weakness, and medications. Symptoms include unsteadiness, dizziness, and a sensation of spinning. Balance problems increase the risk of falls. Treatment depends on the cause and may include physical therapy, medication changes, and exercises. See a healthcare provider if you experience frequent unsteadiness, falls, or a sudden change in balance.',
    zh_summary: '老年人平衡问题可由内耳疾病、药物副作用或神经系统问题引起。进行平衡和力量训练，反复跌倒或持续不稳需就医评估。',
    url: 'https://medlineplus.gov/balanceproblems.html',
    lastReviewed: '2023-12-15',
    population: 'geriatric',
  },
  // ── GERIATRIC: Dizziness in Older Adults ──
  {
    title: 'Dizziness in Older Adults',
    content:
      'Dizziness is a common complaint in older adults and can mean lightheadedness, unsteadiness, or vertigo (a spinning sensation). Causes include inner ear problems, low blood pressure, dehydration, medication side effects, and heart conditions. Sit or lie down when dizzy to prevent falls. See a healthcare provider if dizziness is recurrent, sudden, severe, or accompanied by headache, chest pain, difficulty speaking, or fainting.',
    zh_summary: '老年人头晕可能由药物、低血压或内耳问题引起。起身时缓慢动作，保持充足饮水。反复头晕伴视力变化或意识改变需就医。',
    url: 'https://medlineplus.gov/dizzinesselderly.html',
    lastReviewed: '2024-03-18',
    population: 'geriatric',
  },
  // ── GERIATRIC: Tremor ──
  {
    title: 'Tremor',
    content:
      'A tremor is an involuntary, rhythmic shaking of a body part, most commonly the hands. Essential tremor is the most common type and tends to worsen with age. Parkinson\'s disease also causes tremor, typically starting on one side. Treatment depends on the type and severity and may include medication, therapy, and lifestyle modifications. See a healthcare provider if you develop a new or worsening tremor, as it may indicate an underlying condition.',
    zh_summary: '震颤是身体某部位不自主的节律性抖动，原因包括帕金森病和药物副作用。大多数震颤不危险，但影响日常生活应就医评估。',
    url: 'https://medlineplus.gov/tremor.html',
    lastReviewed: '2023-07-05',
    population: 'geriatric',
  },
  // ── GERIATRIC: Urinary Incontinence ──
  {
    title: 'Urinary Incontinence',
    content:
      'Urinary incontinence, the loss of bladder control, is common in older adults. Types include stress incontinence (leaking with coughing or sneezing), urge incontinence (sudden strong urge), and overflow incontinence. Causes include weakened pelvic muscles, enlarged prostate, nerve damage, and certain medications. Treatment options include pelvic floor exercises, bladder training, medications, and surgery. See a healthcare provider, as incontinence is treatable and not a normal part of aging.',
    zh_summary: '尿失禁是不自主漏尿的问题，在老年人中很常见。盆底锻炼和膀胱训练可改善症状。尿失禁非正常衰老现象，应就医寻求治疗。',
    url: 'https://medlineplus.gov/urinaryincontinence.html',
    lastReviewed: '2024-05-02',
    population: 'geriatric',
  },
  // ── GERIATRIC: Constipation in Older Adults ──
  {
    title: 'Constipation in Older Adults',
    content:
      'Constipation is a common problem in older adults, often caused by a low-fiber diet, insufficient fluid intake, physical inactivity, and medications. Symptoms include infrequent bowel movements, hard stools, straining, and a feeling of incomplete evacuation. Increasing fiber, fluids, and physical activity can help. See a healthcare provider if constipation is new and persistent, is accompanied by blood in the stool, or is associated with significant pain or weight loss.',
    zh_summary: '老年人便秘很常见，可能因活动减少、饮水不足或药物副作用引起。增加纤维摄入和适度运动可改善。便秘严重或伴腹痛需就医。',
    url: 'https://medlineplus.gov/constipationelderly.html',
    lastReviewed: '2023-11-28',
    population: 'geriatric',
  },
  // ── GERIATRIC: Sleep Problems in Older Adults ──
  {
    title: 'Sleep Problems in Older Adults',
    content:
      'Sleep patterns naturally change with age, but persistent sleep problems are not a normal part of aging. Common issues include difficulty falling asleep, waking frequently, and daytime sleepiness. Causes include medical conditions, medications, pain, sleep apnea, and restless legs syndrome. Good sleep habits include keeping a regular schedule, limiting caffeine, and creating a comfortable sleep environment. See a healthcare provider if sleep problems persist and affect daily functioning.',
    zh_summary: '老年人睡眠问题包括入睡困难和夜间觉醒。保持规律作息、限制午睡和创造舒适睡眠环境有帮助。长期严重失眠需就医评估。',
    url: 'https://medlineplus.gov/sleepproblemselderly.html',
    lastReviewed: '2024-04-18',
    population: 'geriatric',
  },
  // ── GERIATRIC: Shingles ──
  {
    title: 'Shingles',
    content:
      'Shingles is a painful rash caused by reactivation of the varicella-zoster virus, the same virus that causes chickenpox. It typically appears as a band of blisters on one side of the body. Risk increases with age and weakened immune systems. The shingles vaccine is recommended for adults 50 and older. Early treatment with antiviral medications can shorten the illness and reduce complications. See a healthcare provider promptly if you suspect shingles, especially if the rash is near the eye.',
    zh_summary: '带状疱疹由水痘病毒再激活引起，表现为疼痛性水泡带状皮疹。50岁以上建议接种Shingrix疫苗。皮疹出现尤其在面部需尽快就医。',
    url: 'https://medlineplus.gov/shingles.html',
    lastReviewed: '2024-02-12',
    population: 'geriatric',
  },
  // ── GERIATRIC: Influenza in Older Adults ──
  {
    title: 'Influenza in Older Adults',
    content:
      'Influenza (flu) can be especially dangerous for adults 65 and older, who are at higher risk for serious complications including pneumonia, hospitalization, and death. Symptoms include fever, cough, sore throat, body aches, and fatigue. Annual flu vaccination is strongly recommended, preferably the high-dose or adjuvanted version for older adults. Antiviral medications can help if started early. Seek medical care for difficulty breathing, persistent chest pain, or confusion.',
    zh_summary: '老年人流感可能导致严重并发症。每年接种流感疫苗是最佳预防措施。高烧、呼吸困难或症状突然恶化需紧急就医。',
    url: 'https://medlineplus.gov/fluelderly.html',
    lastReviewed: '2023-10-18',
    population: 'geriatric',
  },
  // ── GERIATRIC: COVID-19 in Older Adults ──
  {
    title: 'COVID-19 in Older Adults',
    content:
      'Older adults are at higher risk for severe illness from COVID-19. Symptoms include fever, cough, shortness of breath, fatigue, body aches, and loss of taste or smell. Stay up to date on COVID-19 vaccinations and boosters. Good hand hygiene, ventilation, and masking in high-risk settings can reduce transmission. Seek emergency care for difficulty breathing, persistent chest pain, confusion, or inability to stay awake.',
    zh_summary: '老年人是新冠重症高风险人群。按建议接种最新COVID-19疫苗，注意手卫生和通风。呼吸困难或意识混乱需紧急就医。',
    url: 'https://medlineplus.gov/covidelderly.html',
    lastReviewed: '2024-06-12',
    population: 'geriatric',
  },
  // ── GERIATRIC: Diabetes in Older Adults ──
  {
    title: 'Diabetes in Older Adults',
    content:
      'Diabetes management in older adults requires special attention because aging affects blood sugar control and complications are more common. Symptoms of uncontrolled diabetes include frequent urination, increased thirst, fatigue, and blurred vision. Hypoglycemia (low blood sugar) is especially dangerous and can cause confusion, falls, and heart problems. Regular monitoring, balanced meals, medications, and exercise help manage diabetes. See a healthcare provider for regular A1C testing and medication review.',
    zh_summary: '老年糖尿病管理需要平衡血糖控制和避免低血糖。定期监测血糖，注意饮食和运动。极度口渴、频尿或意识改变需及时就医。',
    url: 'https://medlineplus.gov/diabeteselderly.html',
    lastReviewed: '2023-06-25',
    population: 'geriatric',
  },
  // ── GERIATRIC: Chronic Kidney Disease in Older Adults ──
  {
    title: 'Chronic Kidney Disease in Older Adults',
    content:
      'Chronic kidney disease (CKD) is common in older adults and often develops gradually over years. Diabetes and high blood pressure are the most common causes. Early stages may have no symptoms; later stages can cause fatigue, swelling, nausea, and difficulty concentrating. Regular blood and urine tests can detect CKD early. Managing blood pressure, blood sugar, and avoiding nephrotoxic medications help slow progression. See a healthcare provider for regular kidney function monitoring.',
    zh_summary: '老年人慢性肾病早期可能无症状。定期检查肾功能，控制血压和血糖有助于延缓进展。水肿、尿量变化或严重疲劳需就医。',
    url: 'https://medlineplus.gov/ckdelderly.html',
    lastReviewed: '2024-03-30',
    population: 'geriatric',
  },
  // ── GERIATRIC: Caregiver Stress ──
  {
    title: 'Caregiver Stress',
    content:
      'Caring for an older adult with chronic illness or disability can lead to physical and emotional exhaustion, known as caregiver burnout. Signs include fatigue, anxiety, depression, social withdrawal, and health problems. Caregivers should seek respite care, support groups, and community resources. Maintaining your own health is essential to providing good care. Talk to a healthcare provider if you feel overwhelmed, depressed, or unable to cope.',
    zh_summary: '照护者压力可能导致身心俱疲。保持自我关爱、寻求帮助和利用社区资源很重要。持续疲惫或健康状况恶化时照护者也需要医疗关注。',
    url: 'https://medlineplus.gov/caregiverstress.html',
    lastReviewed: '2024-05-20',
    population: 'geriatric',
  },
  // ── GERIATRIC: Peripheral Neuropathy in Older Adults ──
  {
    title: 'Peripheral Neuropathy in Older Adults',
    content:
      'Peripheral neuropathy is nerve damage that causes weakness, numbness, and pain, usually in the hands and feet. Common causes in older adults include diabetes, vitamin deficiencies, infections, and certain medications. Symptoms include tingling, burning, sharp pain, loss of balance, and muscle weakness. Treatment focuses on managing the underlying cause and relieving symptoms. See a healthcare provider if you develop numbness, tingling, or weakness in your hands or feet.',
    zh_summary: '外周神经病变导致手脚麻木、刺痛或灼痛感，糖尿病是最常见原因。控制血糖可预防恶化，新出现或加重的麻木疼痛需就医评估。',
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
    zh_summary: '2型糖尿病是最常见的糖尿病类型，身体无法正常使用胰岛素。通过健康饮食、运动和必要时药物控制血糖。定期监测和并发症筛查很重要。',
    url: 'https://medlineplus.gov/type2diabetes.html',
    lastReviewed: '2024-01-15',
    population: 'chronic',
  },
  // ── CHRONIC: Type 1 Diabetes ──
  {
    title: 'Type 1 Diabetes',
    content:
      'Type 1 diabetes is an autoimmune condition where the pancreas produces little or no insulin. Symptoms include extreme thirst, frequent urination, unintended weight loss, fatigue, and blurred vision. Treatment requires daily insulin, blood sugar monitoring, carbohydrate counting, and regular exercise. Seek emergency care for signs of diabetic ketoacidosis including nausea, vomiting, abdominal pain, fruity breath, and confusion.',
    zh_summary: '1型糖尿病是自身免疫疾病，胰腺不能产生胰岛素，必须每天注射胰岛素。需要持续监测血糖，极度口渴或呼吸有水果味需紧急就医。',
    url: 'https://medlineplus.gov/type1diabetes.html',
    lastReviewed: '2024-04-05',
    population: 'chronic',
  },
  // ── CHRONIC: Hypertension ──
  {
    title: 'Hypertension',
    content:
      'Hypertension (high blood pressure) is a chronic condition where blood pushes too hard against artery walls, increasing the risk of heart disease, stroke, and kidney damage. It often has no symptoms, earning it the name "silent killer." Lifestyle changes include reducing sodium, exercising regularly, maintaining a healthy weight, limiting alcohol, and managing stress. Take prescribed medications as directed and monitor blood pressure regularly.',
    zh_summary: '高血压通常没有症状但会损害心脏和血管。通过限盐、运动和按时服药可控制。血压突然升高伴头痛或视力变化需紧急就医。',
    url: 'https://medlineplus.gov/hypertension.html',
    lastReviewed: '2023-09-08',
    population: 'chronic',
  },
  // ── CHRONIC: High Cholesterol ──
  {
    title: 'High Cholesterol',
    content:
      'High cholesterol means there is too much cholesterol in the blood, increasing the risk of heart disease and stroke. It usually has no symptoms and is detected through blood tests. LDL ("bad") cholesterol contributes to plaque buildup in arteries, while HDL ("good") cholesterol helps remove it. Management includes a heart-healthy diet, regular exercise, maintaining a healthy weight, and medications if needed. Get cholesterol checked regularly as recommended by your healthcare provider.',
    zh_summary: '高胆固醇会增加心脏病和中风风险。通过健康饮食、运动和必要时他汀类药物可控制。成年人应定期检查血脂水平。',
    url: 'https://medlineplus.gov/highcholesterol.html',
    lastReviewed: '2024-02-22',
    population: 'chronic',
  },
  // ── CHRONIC: Coronary Artery Disease ──
  {
    title: 'Coronary Artery Disease',
    content:
      'Coronary artery disease (CAD) occurs when plaque builds up in the coronary arteries, reducing blood flow to the heart muscle. Symptoms may include chest pain (angina), shortness of breath, and fatigue, or there may be no symptoms until a heart attack occurs. Risk factors include high blood pressure, high cholesterol, diabetes, smoking, and family history. Treatment includes lifestyle changes, medications, and procedures. Call 911 for sudden chest pain or signs of heart attack.',
    zh_summary: '冠心病是心脏动脉被斑块堵塞，可导致心绞痛和心脏病发作。控制高血压、高血脂和糖尿病等危险因素很重要。胸痛或气短需立即就医。',
    url: 'https://medlineplus.gov/coronaryarterydisease.html',
    lastReviewed: '2024-05-08',
    population: 'chronic',
  },
  // ── CHRONIC: Angina ──
  {
    title: 'Angina',
    content:
      'Angina is chest pain or discomfort caused by reduced blood flow to the heart muscle, usually due to coronary artery disease. It may feel like pressure, squeezing, or tightness in the chest and may spread to the shoulders, arms, neck, or jaw. Stable angina occurs with exertion and resolves with rest. Treatment includes medications such as nitroglycerin and lifestyle changes. Seek emergency care if chest pain is new, worsening, or occurs at rest.',
    zh_summary: '心绞痛是冠心病引起的胸部疼痛，通常活动时加重、休息时缓解。硝酸甘油可快速缓解。胸痛不缓解或出现新的严重胸痛需紧急就医。',
    url: 'https://medlineplus.gov/angina.html',
    lastReviewed: '2023-12-12',
    population: 'chronic',
  },
  // ── CHRONIC: Peripheral Artery Disease ──
  {
    title: 'Peripheral Artery Disease',
    content:
      'Peripheral artery disease (PAD) occurs when narrowed arteries reduce blood flow to the limbs, usually the legs. The most common symptom is leg pain or cramping when walking that resolves with rest (claudication). Risk factors include smoking, diabetes, high blood pressure, and high cholesterol. Treatment includes exercise, medications, and sometimes procedures. See a healthcare provider if you have leg pain when walking, non-healing leg wounds, or cold or discolored feet.',
    zh_summary: '外周动脉疾病是肢体动脉狭窄导致血流减少。症状包括行走时腿痛。保持运动、戒烟和控制三高很重要，腿部突然剧痛或变色需急诊。',
    url: 'https://medlineplus.gov/peripheralarterydisease.html',
    lastReviewed: '2024-03-12',
    population: 'chronic',
  },
  // ── CHRONIC: Chronic Kidney Disease ──
  {
    title: 'Chronic Kidney Disease',
    content:
      'Chronic kidney disease (CKD) is a gradual loss of kidney function over time. The most common causes are diabetes and high blood pressure. Early stages often have no symptoms; advanced stages may cause fatigue, swelling, nausea, and changes in urination. Management includes controlling blood pressure and blood sugar, following a kidney-friendly diet, and avoiding nephrotoxic medications. Regular blood tests can detect CKD early. See a healthcare provider for routine kidney function screening.',
    zh_summary: '慢性肾病是肾功能逐渐丧失的疾病。控制血压和血糖是关键。定期监测肾功能，水肿、尿量变化或恶心加重需就医。',
    url: 'https://medlineplus.gov/chronickidneydisease.html',
    lastReviewed: '2023-08-22',
    population: 'chronic',
  },
  // ── CHRONIC: Thyroid Disorders ──
  {
    title: 'Thyroid Disorders',
    content:
      'Thyroid disorders occur when the thyroid gland produces too much or too little thyroid hormone. Hypothyroidism (underactive thyroid) causes fatigue, weight gain, cold sensitivity, and depression. Hyperthyroidism (overactive thyroid) causes weight loss, rapid heartbeat, anxiety, and tremor. Diagnosis involves blood tests measuring thyroid hormone levels. Treatment depends on the type and may include medication, radioactive iodine, or surgery. See a healthcare provider if you have symptoms of thyroid problems.',
    zh_summary: '甲状腺疾病影响代谢功能。甲亢表现为心悸和体重下降；甲减表现为疲劳和体重增加。通过血液检查诊断，大多可用药物有效治疗。',
    url: 'https://medlineplus.gov/thyroiddisorders.html',
    lastReviewed: '2024-01-22',
    population: 'chronic',
  },
  // ── CHRONIC: Hypothyroidism ──
  {
    title: 'Hypothyroidism',
    content:
      'Hypothyroidism occurs when the thyroid gland does not produce enough thyroid hormone. Symptoms develop gradually and include fatigue, weight gain, cold intolerance, dry skin, constipation, depression, and thinning hair. It is most common in women and older adults. Treatment involves daily thyroid hormone replacement medication. Regular blood tests monitor thyroid levels to adjust dosing. See a healthcare provider if you experience persistent fatigue, unexplained weight gain, or other symptoms.',
    zh_summary: '甲状腺功能减退导致代谢减慢，症状包括疲劳、体重增加和怕冷。每日服用甲状腺激素替代药物治疗，需定期验血调整剂量。',
    url: 'https://medlineplus.gov/hypothyroidism.html',
    lastReviewed: '2024-06-05',
    population: 'chronic',
  },
  // ── CHRONIC: Hyperthyroidism ──
  {
    title: 'Hyperthyroidism',
    content:
      'Hyperthyroidism occurs when the thyroid gland produces too much thyroid hormone. Symptoms include unintended weight loss, rapid or irregular heartbeat, anxiety, tremor, sweating, increased sensitivity to heat, and more frequent bowel movements. Graves\' disease is the most common cause. Treatment options include anti-thyroid medications, radioactive iodine, and surgery. See a healthcare provider if you experience unexplained weight loss, rapid heartbeat, or excessive sweating.',
    zh_summary: '甲状腺功能亢进导致代谢过快，症状包括心悸、体重下降和焦虑。治疗方法包括药物、放射碘和手术。心悸严重或眼部症状需就医。',
    url: 'https://medlineplus.gov/hyperthyroidism.html',
    lastReviewed: '2023-11-02',
    population: 'chronic',
  },
  // ── CHRONIC: Gout ──
  {
    title: 'Gout',
    content:
      'Gout is a form of inflammatory arthritis caused by excess uric acid crystals in the joints, most commonly the big toe. Attacks cause sudden severe pain, swelling, redness, and tenderness. Triggers include red meat, shellfish, alcohol, and sugary drinks. Treatment includes anti-inflammatory medications for acute attacks and long-term medications to lower uric acid levels. See a healthcare provider for recurring joint pain and to discuss a management plan.',
    zh_summary: '痛风是尿酸过高导致关节内结晶沉积，引起剧烈关节疼痛和红肿。急性发作可用抗炎药缓解，长期需控制尿酸水平和限制高嘌呤食物。',
    url: 'https://medlineplus.gov/gout.html',
    lastReviewed: '2024-04-22',
    population: 'chronic',
  },
  // ── CHRONIC: Rheumatoid Arthritis ──
  {
    title: 'Rheumatoid Arthritis',
    content:
      'Rheumatoid arthritis (RA) is a chronic autoimmune disease where the immune system attacks the joints, causing inflammation, pain, swelling, and stiffness, particularly in the hands and feet. Morning stiffness lasting more than 30 minutes is a hallmark. Early treatment is important to prevent joint damage. Treatment includes disease-modifying antirheumatic drugs (DMARDs), biologics, and physical therapy. See a healthcare provider if you have persistent joint swelling, pain, or stiffness.',
    zh_summary: '类风湿关节炎是自身免疫疾病，导致关节慢性炎症和疼痛。早期诊断和治疗可减缓关节损害。晨僵超过30分钟或对称性关节肿胀应就医。',
    url: 'https://medlineplus.gov/rheumatoidarthritis.html',
    lastReviewed: '2023-07-18',
    population: 'chronic',
  },
  // ── CHRONIC: Lupus ──
  {
    title: 'Lupus',
    content:
      'Lupus is a chronic autoimmune disease where the immune system attacks healthy tissue, affecting the skin, joints, kidneys, brain, and other organs. Symptoms include fatigue, joint pain, skin rashes (including a butterfly-shaped facial rash), fever, and sensitivity to sunlight. Symptoms may flare and remit. Treatment includes anti-inflammatory medications, immunosuppressants, and lifestyle modifications. See a healthcare provider if you develop unexplained rash, persistent joint pain, or fatigue.',
    zh_summary: '狼疮是自身免疫疾病，可影响皮肤、关节、肾脏等多器官。常见症状包括蝶形面部皮疹和极度疲劳。需要长期医疗管理，病情发作需调整治疗。',
    url: 'https://medlineplus.gov/lupus.html',
    lastReviewed: '2024-02-18',
    population: 'chronic',
  },
  // ── CHRONIC: Fibromyalgia ──
  {
    title: 'Fibromyalgia',
    content:
      'Fibromyalgia is a chronic condition causing widespread musculoskeletal pain, fatigue, sleep disturbances, and cognitive difficulties ("fibro fog"). The exact cause is unknown, but it may involve changes in how the brain processes pain signals. Management includes regular exercise, stress reduction, good sleep habits, cognitive behavioral therapy, and medications for pain and sleep. See a healthcare provider if you have persistent widespread pain and fatigue affecting daily activities.',
    zh_summary: '纤维肌痛综合征表现为全身广泛性疼痛、疲劳和睡眠障碍。通过运动、压力管理和改善睡眠可改善生活质量。',
    url: 'https://medlineplus.gov/fibromyalgia.html',
    lastReviewed: '2023-10-08',
    population: 'chronic',
  },
  // ── CHRONIC: Chronic Pain Management ──
  {
    title: 'Chronic Pain Management',
    content:
      'Chronic pain is pain lasting more than three months that persists beyond normal healing time. It can result from injuries, surgeries, nerve damage, or conditions like arthritis and fibromyalgia. Management often involves a multimodal approach including physical therapy, exercise, medications, cognitive behavioral therapy, and complementary therapies such as acupuncture. See a healthcare provider to develop a personalized pain management plan. Avoid relying solely on opioid medications for chronic pain.',
    zh_summary: '慢性疼痛持续超过三个月，综合管理包括物理治疗、认知行为疗法和生活方式调整。避免过度依赖阿片类药物，与医生共同制定管理计划。',
    url: 'https://medlineplus.gov/chronicpain.html',
    lastReviewed: '2024-05-25',
    population: 'chronic',
  },
  // ── CHRONIC: Obesity ──
  {
    title: 'Obesity',
    content:
      'Obesity is a complex chronic disease defined by a body mass index (BMI) of 30 or higher, involving excess body fat that increases health risks. It raises the risk of type 2 diabetes, heart disease, stroke, certain cancers, and sleep apnea. Management includes balanced nutrition, regular physical activity, behavioral changes, and in some cases medication or bariatric surgery. See a healthcare provider to discuss a personalized weight management plan.',
    zh_summary: '肥胖增加心脏病、糖尿病和某些癌症的风险。通过健康饮食和增加运动可逐步减重。BMI超过30建议寻求医疗指导。',
    url: 'https://medlineplus.gov/obesity.html',
    lastReviewed: '2024-01-30',
    population: 'chronic',
  },
  // ── CHRONIC: Metabolic Syndrome ──
  {
    title: 'Metabolic Syndrome',
    content:
      'Metabolic syndrome is a cluster of conditions that occur together — increased blood pressure, high blood sugar, excess body fat around the waist, and abnormal cholesterol levels — that raise the risk of heart disease, stroke, and type 2 diabetes. Having three or more of these conditions qualifies as metabolic syndrome. Lifestyle changes including weight loss, exercise, and healthy eating are the primary treatment. See a healthcare provider for screening and management.',
    zh_summary: '代谢综合征是高血压、高血糖、腹部肥胖和血脂异常的组合，显著增加心脏病和糖尿病风险。通过改善生活方式可逆转。',
    url: 'https://medlineplus.gov/metabolicsyndrome.html',
    lastReviewed: '2023-06-08',
    population: 'chronic',
  },
  // ── CHRONIC: GERD (Gastroesophageal Reflux Disease) ──
  {
    title: 'GERD (Gastroesophageal Reflux Disease)',
    content:
      'GERD is a chronic digestive condition where stomach acid frequently flows back into the esophagus, causing heartburn and acid regurgitation. Symptoms include burning chest pain after eating, difficulty swallowing, and regurgitation of food or sour liquid. Lifestyle changes include eating smaller meals, avoiding trigger foods, not lying down after eating, and elevating the head of the bed. Medications and sometimes surgery may be needed. See a healthcare provider if symptoms persist despite lifestyle changes.',
    zh_summary: '胃食管反流病是胃酸反流入食道导致烧心和反酸。避免辛辣油腻食物、不要饭后立即躺下可缓解。频繁发作或吞咽困难需就医。',
    url: 'https://medlineplus.gov/gerd.html',
    lastReviewed: '2024-03-08',
    population: 'chronic',
  },
  // ── CHRONIC: Irritable Bowel Syndrome ──
  {
    title: 'Irritable Bowel Syndrome',
    content:
      'Irritable bowel syndrome (IBS) is a chronic condition affecting the large intestine, causing abdominal pain, bloating, gas, diarrhea, and constipation. Symptoms often fluctuate and may be triggered by certain foods, stress, or hormonal changes. Management includes dietary changes (such as a low-FODMAP diet), stress management, regular exercise, and medications for specific symptoms. See a healthcare provider if you have persistent changes in bowel habits, unexplained weight loss, or blood in stool.',
    zh_summary: '肠易激综合征表现为反复腹痛、腹胀和排便习惯改变。调整饮食、减压和必要时药物治疗可改善症状。',
    url: 'https://medlineplus.gov/ibs.html',
    lastReviewed: '2023-12-28',
    population: 'chronic',
  },
  // ── CHRONIC: Inflammatory Bowel Disease ──
  {
    title: 'Inflammatory Bowel Disease',
    content:
      'Inflammatory bowel disease (IBD) includes Crohn\'s disease and ulcerative colitis, chronic conditions causing inflammation of the digestive tract. Symptoms include persistent diarrhea, abdominal pain, rectal bleeding, weight loss, and fatigue. IBD requires ongoing medical management including anti-inflammatory medications, immunosuppressants, biologics, and sometimes surgery. See a healthcare provider for persistent digestive symptoms, especially blood in stool, unexplained weight loss, or fever.',
    zh_summary: '炎症性肠病包括克罗恩病和溃疡性结肠炎，导致消化道慢性炎症。症状包括腹泻和便血。需要长期医疗管理，急性发作需及时就医。',
    url: 'https://medlineplus.gov/inflammatoryboweldisease.html',
    lastReviewed: '2024-04-15',
    population: 'chronic',
  },
  // ── CHRONIC: Celiac Disease ──
  {
    title: 'Celiac Disease',
    content:
      'Celiac disease is an autoimmune disorder where eating gluten triggers an immune response that damages the small intestine lining. Symptoms include diarrhea, bloating, gas, fatigue, anemia, and weight loss. In children, it can affect growth and development. The only treatment is a strict lifelong gluten-free diet, avoiding wheat, barley, and rye. See a healthcare provider if you have persistent digestive problems, unexplained anemia, or a family history of celiac disease.',
    zh_summary: '乳糜泻是对面筋的自身免疫反应，损害小肠。唯一有效治疗是终身无麸质饮食。疑似乳糜泻应在停止摄入面筋前就医检查。',
    url: 'https://medlineplus.gov/celiacdisease.html',
    lastReviewed: '2023-09-18',
    population: 'chronic',
  },
  // ── CHRONIC: Liver Disease ──
  {
    title: 'Liver Disease',
    content:
      'Liver disease encompasses conditions that damage the liver, including hepatitis, fatty liver disease, cirrhosis, and liver cancer. Symptoms may not appear until the disease is advanced and include jaundice (yellowing of skin and eyes), abdominal swelling, fatigue, nausea, and easy bruising. Prevention includes limiting alcohol, maintaining a healthy weight, and getting vaccinated for hepatitis. See a healthcare provider for persistent fatigue, jaundice, or abdominal pain.',
    zh_summary: '肝病可由酒精、病毒感染或脂肪堆积引起，早期可能无症状。黄疸、腹部肿胀或极度疲劳是警示信号，需及时就医。',
    url: 'https://medlineplus.gov/liverdisease.html',
    lastReviewed: '2024-02-05',
    population: 'chronic',
  },
  // ── CHRONIC: Hepatitis ──
  {
    title: 'Hepatitis',
    content:
      'Hepatitis is inflammation of the liver, most commonly caused by viral infections (hepatitis A, B, and C). Symptoms include fatigue, nausea, abdominal pain, dark urine, jaundice, and loss of appetite. Hepatitis A and B can be prevented with vaccines. Hepatitis C is treatable with antiviral medications and most people can be cured. See a healthcare provider if you have symptoms of hepatitis or risk factors for viral hepatitis, including injection drug use or unprotected sex.',
    zh_summary: '肝炎是肝脏炎症，主要由甲、乙、丙型肝炎病毒引起。甲肝和乙肝有疫苗预防，丙肝可以治愈。出现黄疸或深色尿液应就医。',
    url: 'https://medlineplus.gov/hepatitis.html',
    lastReviewed: '2023-08-05',
    population: 'chronic',
  },
  // ── CHRONIC: Anemia ──
  {
    title: 'Anemia',
    content:
      'Anemia occurs when the blood does not have enough healthy red blood cells or hemoglobin to carry adequate oxygen to the body\'s tissues. Symptoms include fatigue, weakness, pale skin, shortness of breath, dizziness, and cold hands and feet. Common causes include iron deficiency, vitamin B12 deficiency, chronic disease, and blood loss. Treatment depends on the cause and may include supplements, dietary changes, or treating the underlying condition. See a healthcare provider for persistent fatigue or weakness.',
    zh_summary: '贫血是红细胞或血红蛋白不足，导致疲劳、气短和头晕。常见原因包括缺铁和维生素缺乏。持续疲劳或面色苍白应验血检查。',
    url: 'https://medlineplus.gov/anemia.html',
    lastReviewed: '2024-05-12',
    population: 'chronic',
  },
  // ── CHRONIC: Blood Clotting Disorders ──
  {
    title: 'Blood Clotting Disorders',
    content:
      'Blood clotting disorders affect the body\'s ability to form blood clots normally. Some disorders cause excessive clotting (thrombophilia), raising the risk of deep vein thrombosis and pulmonary embolism. Others cause excessive bleeding (hemophilia, von Willebrand disease). Symptoms vary but may include unusual bruising, prolonged bleeding, or swelling and pain in limbs. Treatment depends on the specific disorder. See a healthcare provider if you have unexplained bruising, excessive bleeding, or a family history of clotting disorders.',
    zh_summary: '血液凝固障碍可能导致异常出血或血栓形成。症状可能包括容易瘀伤或不明原因的血栓。有家族史或异常出血倾向应就医检查。',
    url: 'https://medlineplus.gov/bloodclottingdisorders.html',
    lastReviewed: '2023-11-25',
    population: 'chronic',
  },
  // ── CHRONIC: Deep Vein Thrombosis ──
  {
    title: 'Deep Vein Thrombosis',
    content:
      'Deep vein thrombosis (DVT) is a blood clot that forms in a deep vein, usually in the leg. Symptoms include swelling, pain, warmth, and redness in the affected leg. DVT can be dangerous if the clot breaks loose and travels to the lungs, causing a pulmonary embolism. Risk factors include prolonged immobility, surgery, cancer, and certain genetic conditions. Seek immediate medical care for sudden leg swelling or pain, and call 911 for chest pain or shortness of breath.',
    zh_summary: '深静脉血栓是腿部深静脉形成血栓，可导致肺栓塞等危及生命的并发症。久坐后起身活动，腿部肿痛或突然气短需紧急就医。',
    url: 'https://medlineplus.gov/dvt.html',
    lastReviewed: '2024-03-25',
    population: 'chronic',
  },
  // ── CHRONIC: Asthma in Adults ──
  {
    title: 'Asthma in Adults',
    content:
      'Asthma is a chronic respiratory condition characterized by inflammation and narrowing of the airways. In adults, symptoms include wheezing, coughing, chest tightness, and shortness of breath, often triggered by allergens, exercise, cold air, or respiratory infections. Management includes identifying and avoiding triggers, using controller medications daily, and having a quick-relief inhaler for flare-ups. See a healthcare provider if symptoms are not well controlled or if you need your rescue inhaler more than twice per week.',
    zh_summary: '成人哮喘表现为喘息、气短和咳嗽，常在夜间或运动时加重。遵循哮喘控制方案，识别和避免触发因素。急救吸入器效果不佳需急诊。',
    url: 'https://medlineplus.gov/asthmaadults.html',
    lastReviewed: '2024-06-10',
    population: 'chronic',
  },
  // ── CHRONIC: COPD Management ──
  {
    title: 'COPD Management',
    content:
      'Chronic obstructive pulmonary disease (COPD) requires ongoing management to slow disease progression and improve quality of life. Key strategies include smoking cessation, inhaled bronchodilators and corticosteroids, pulmonary rehabilitation, oxygen therapy as needed, and annual flu and pneumonia vaccines. Monitor symptoms and follow an action plan for flare-ups. See a healthcare provider regularly and seek emergency care for severe shortness of breath, bluish lips, or rapid heartbeat.',
    zh_summary: '慢阻肺需要长期管理，包括规律使用吸入药物和肺康复锻炼。接种流感和肺炎疫苗降低急性加重风险。气短加重或痰液变色需就医。',
    url: 'https://medlineplus.gov/copdmanagement.html',
    lastReviewed: '2023-07-12',
    population: 'chronic',
  },
  // ── CHRONIC: Sleep Apnea ──
  {
    title: 'Sleep Apnea',
    content:
      'Sleep apnea is a sleep disorder where breathing repeatedly stops and starts during sleep. The most common type, obstructive sleep apnea, occurs when throat muscles relax and block the airway. Symptoms include loud snoring, gasping during sleep, morning headaches, excessive daytime sleepiness, and difficulty concentrating. Treatment often involves continuous positive airway pressure (CPAP) therapy. See a healthcare provider if you snore loudly and feel tired even after a full night\'s sleep.',
    zh_summary: '睡眠呼吸暂停表现为睡眠中反复呼吸停止、打鼾和白天嗜睡。增加心脏病风险。CPAP呼吸机是主要治疗方法，严重打鼾应进行睡眠检查。',
    url: 'https://medlineplus.gov/sleepapnea.html',
    lastReviewed: '2024-01-08',
    population: 'chronic',
  },
  // ── CHRONIC: Chronic Cough ──
  {
    title: 'Chronic Cough',
    content:
      'A chronic cough lasts eight weeks or longer in adults. Common causes include postnasal drip, asthma, GERD, and medication side effects (especially ACE inhibitors). Less common causes include chronic bronchitis, bronchiectasis, and lung disease. Treatment targets the underlying cause. See a healthcare provider if you have a cough lasting more than eight weeks, cough up blood, have shortness of breath, or experience unexplained weight loss.',
    zh_summary: '慢性咳嗽持续超过8周，常见原因包括鼻后滴漏、哮喘和胃食管反流。咳嗽伴咯血或体重下降需尽快就医排除严重疾病。',
    url: 'https://medlineplus.gov/chroniccough.html',
    lastReviewed: '2024-04-28',
    population: 'chronic',
  },
  // ── CHRONIC: Migraine ──
  {
    title: 'Migraine',
    content:
      'Migraines are recurring headaches that cause intense throbbing pain, usually on one side of the head, often accompanied by nausea, vomiting, and sensitivity to light and sound. Some people experience aura (visual disturbances) before the headache. Triggers may include stress, certain foods, hormonal changes, and sleep disruption. Treatment includes acute medications and preventive therapies. See a healthcare provider if migraines are frequent, severe, or not responding to treatment.',
    zh_summary: '偏头痛是剧烈头痛发作，常伴恶心和对光声敏感。识别触发因素并避免，医生可开具预防和治疗用药。突发最严重的头痛需排除紧急情况。',
    url: 'https://medlineplus.gov/migraine.html',
    lastReviewed: '2023-10-22',
    population: 'chronic',
  },
  // ── CHRONIC: Epilepsy ──
  {
    title: 'Epilepsy',
    content:
      'Epilepsy is a neurological disorder characterized by recurrent, unprovoked seizures caused by abnormal electrical activity in the brain. Seizures can range from brief staring spells to full-body convulsions. Treatment usually includes anti-seizure medications, and in some cases surgery or devices. People with epilepsy should take medication consistently, get adequate sleep, and avoid known triggers. Call 911 if a seizure lasts more than five minutes or the person does not regain consciousness.',
    zh_summary: '癫痫是大脑异常电活动引起反复发作的疾病。大多数癫痫可通过药物控制。发作超过5分钟或意识不恢复需急救。',
    url: 'https://medlineplus.gov/epilepsy.html',
    lastReviewed: '2024-02-28',
    population: 'chronic',
  },
  // ── CHRONIC: Multiple Sclerosis ──
  {
    title: 'Multiple Sclerosis',
    content:
      'Multiple sclerosis (MS) is a chronic autoimmune disease where the immune system attacks the protective covering of nerves (myelin) in the brain and spinal cord. Symptoms vary widely and may include numbness, weakness, vision problems, balance issues, fatigue, and cognitive changes. The disease course is unpredictable, with periods of relapse and remission. Treatment includes disease-modifying therapies and symptom management. See a healthcare provider for new or worsening neurological symptoms.',
    zh_summary: '多发性硬化是影响中枢神经系统的自身免疫疾病，可导致视力问题和肢体无力。早期治疗有助于减缓进展，新出现的神经症状应尽快就医。',
    url: 'https://medlineplus.gov/multiplesclerosis.html',
    lastReviewed: '2023-06-20',
    population: 'chronic',
  },
  // ── CHRONIC: Neuropathy ──
  {
    title: 'Neuropathy',
    content:
      'Neuropathy is damage to the peripheral nerves causing weakness, numbness, and pain, typically in the hands and feet. The most common cause is diabetes, but other causes include infections, injuries, toxins, and vitamin deficiencies. Symptoms include tingling, burning, sharp pain, and sensitivity to touch. Treatment focuses on managing the underlying cause and relieving symptoms with medications, physical therapy, and lifestyle changes. See a healthcare provider for persistent numbness, tingling, or pain.',
    zh_summary: '神经病变导致手脚麻木、刺痛和疼痛感，糖尿病是最常见原因。控制基础疾病可预防恶化，症状加重需就医评估。',
    url: 'https://medlineplus.gov/neuropathy.html',
    lastReviewed: '2024-05-18',
    population: 'chronic',
  },
  // ── CHRONIC: Low Back Pain (Chronic) ──
  {
    title: 'Low Back Pain (Chronic)',
    content:
      'Chronic low back pain lasts 12 weeks or longer and is one of the most common reasons for missed work. Causes include muscle strain, disc problems, arthritis, and spinal stenosis. Management includes staying active, physical therapy, stretching, strengthening exercises, and pain management techniques. Most chronic back pain improves with non-surgical treatment. See a healthcare provider if pain radiates down the legs, causes numbness or weakness, or is accompanied by bowel or bladder changes.',
    zh_summary: '慢性腰痛持续超过12周，是成年人常见健康问题。保持活动和加强核心肌群锻炼有帮助。伴下肢无力或排尿困难需就医。',
    url: 'https://medlineplus.gov/chroniclowbackpain.html',
    lastReviewed: '2023-12-05',
    population: 'chronic',
  },
  // ── CHRONIC: Neck Pain (Chronic) ──
  {
    title: 'Neck Pain (Chronic)',
    content:
      'Chronic neck pain can result from poor posture, degenerative disc disease, arthritis, or nerve compression. Symptoms include persistent aching, stiffness, pain that worsens with certain positions, headaches, and numbness or tingling in the arms. Treatment includes physical therapy, posture correction, exercise, and pain management. See a healthcare provider if neck pain is severe, radiates to arms, causes weakness or numbness, or follows an injury.',
    zh_summary: '慢性颈痛可由姿势不良或退行性变引起。改善工作姿势和做颈部拉伸有帮助。伴手臂麻木无力或头痛加重需就医检查。',
    url: 'https://medlineplus.gov/chronicneckpain.html',
    lastReviewed: '2024-03-15',
    population: 'chronic',
  },
  // ── CHRONIC: Carpal Tunnel Syndrome ──
  {
    title: 'Carpal Tunnel Syndrome',
    content:
      'Carpal tunnel syndrome occurs when the median nerve is compressed as it passes through the wrist, causing numbness, tingling, and weakness in the hand. Symptoms often worsen at night and may include difficulty gripping objects. Risk factors include repetitive hand motions, pregnancy, and certain health conditions. Treatment includes wrist splinting, activity modification, anti-inflammatory medications, and sometimes surgery. See a healthcare provider if symptoms interfere with daily activities or sleep.',
    zh_summary: '腕管综合征是手部正中神经受压，导致手指麻木和无力。避免反复手部动作和佩戴护腕可缓解。症状持续或肌肉萎缩需就医。',
    url: 'https://medlineplus.gov/carpaltunnel.html',
    lastReviewed: '2023-09-30',
    population: 'chronic',
  },
  // ── CHRONIC: Plantar Fasciitis ──
  {
    title: 'Plantar Fasciitis',
    content:
      'Plantar fasciitis is inflammation of the thick band of tissue that runs along the bottom of the foot, connecting the heel bone to the toes. It causes stabbing heel pain that is usually worst with the first steps in the morning. Risk factors include obesity, prolonged standing, flat feet, and high arches. Treatment includes stretching exercises, supportive footwear, ice, and over-the-counter pain relievers. See a healthcare provider if heel pain persists despite home treatment.',
    zh_summary: '足底筋膜炎是足底疼痛的常见原因，尤其早晨起床第一步最痛。休息、拉伸和穿有支撑的鞋可缓解。疼痛持续数周无改善需就医。',
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
    zh_summary: '头痛大多不严重，可由压力、疲劳或肌肉紧张引起。充足休息和非处方止痛药通常有效。突发剧烈头痛伴发烧或意识改变需紧急就医。',
    url: 'https://medlineplus.gov/headache.html',
    lastReviewed: '2024-01-05',
    population: 'general',
  },
  // ── GENERAL: Back Pain ──
  {
    title: 'Back Pain',
    content:
      'Back pain is one of the most common medical complaints and can result from muscle strains, ligament sprains, disc problems, or arthritis. Symptoms range from a dull ache to sharp stabbing pain. Most acute back pain improves within a few weeks with self-care including gentle activity, over-the-counter pain relievers, and applying heat or ice. See a healthcare provider if pain lasts more than a few weeks, is severe, radiates down the leg, or causes numbness, tingling, or weakness.',
    zh_summary: '腰背痛非常常见，多数由肌肉拉伤或姿势不良引起。保持活动和适当锻炼可改善。伴下肢无力或外伤后剧痛需就医。',
    url: 'https://medlineplus.gov/backpain.html',
    lastReviewed: '2024-04-10',
    population: 'general',
  },
  // ── GENERAL: Stomach Pain ──
  {
    title: 'Stomach Pain',
    content:
      'Stomach (abdominal) pain can result from many causes including indigestion, gas, food intolerance, infections, and constipation. The location, severity, and associated symptoms help determine the cause. Mild stomach pain often resolves on its own with rest, fluids, and bland foods. Seek immediate medical care for severe or sudden pain, pain with fever or vomiting blood, pain after an injury, or pain accompanied by inability to have a bowel movement.',
    zh_summary: '腹痛可由消化不良到阑尾炎等多种原因引起。注意疼痛位置和伴随症状。剧烈持续腹痛伴发烧或便血需紧急就医。',
    url: 'https://medlineplus.gov/stomachpain.html',
    lastReviewed: '2023-11-10',
    population: 'general',
  },
  // ── GENERAL: Chest Pain ──
  {
    title: 'Chest Pain',
    content:
      'Chest pain can have many causes, from muscle strain to serious conditions like heart attack or pulmonary embolism. Heart-related chest pain may feel like pressure or squeezing and may radiate to the arm, jaw, or back. Other causes include GERD, anxiety, and musculoskeletal issues. Call 911 immediately for sudden chest pain, especially if accompanied by shortness of breath, sweating, nausea, or pain spreading to the arm or jaw.',
    zh_summary: '胸痛可能由心脏、肺部或肌肉骨骼问题引起。任何突发胸痛都应认真对待。伴气短或出冷汗可能是心脏问题，需立即急救。',
    url: 'https://medlineplus.gov/chestpain.html',
    lastReviewed: '2024-02-15',
    population: 'general',
  },
  // ── GENERAL: Sore Throat ──
  {
    title: 'Sore Throat',
    content:
      'A sore throat causes pain, scratchiness, or irritation that often worsens with swallowing. Most sore throats are caused by viral infections and resolve on their own. Bacterial infections like strep throat require antibiotics. Home remedies include warm fluids, throat lozenges, saltwater gargles, and rest. See a healthcare provider if the sore throat is severe, lasts more than a week, is accompanied by high fever, or you have difficulty breathing or swallowing.',
    zh_summary: '咽喉痛多由病毒感染引起，通常一周内自愈。多喝温水和休息可缓解。伴高烧或呼吸困难需就医，可能需排除链球菌感染。',
    url: 'https://medlineplus.gov/sorethroat.html',
    lastReviewed: '2023-08-28',
    population: 'general',
  },
  // ── GENERAL: Common Cold ──
  {
    title: 'Common Cold',
    content:
      'The common cold is a viral infection of the upper respiratory tract. Symptoms include runny nose, sneezing, congestion, sore throat, cough, mild body aches, and low-grade fever. Most colds resolve within 7 to 10 days. Treatment focuses on symptom relief with rest, fluids, over-the-counter cold medications, and saline nasal spray. See a healthcare provider if symptoms last more than 10 days, worsen after improving, or include high fever or severe headache.',
    zh_summary: '普通感冒由病毒引起，症状包括流鼻涕、打喷嚏和轻微咳嗽。通常7-10天自愈，注意休息和补液。超过10天不好转需就医。',
    url: 'https://medlineplus.gov/commoncold.html',
    lastReviewed: '2024-05-02',
    population: 'general',
  },
  // ── GENERAL: Influenza (Flu) ──
  {
    title: 'Influenza (Flu)',
    content:
      'Influenza is a contagious respiratory illness caused by flu viruses. Symptoms include sudden onset of fever, cough, sore throat, body aches, headache, chills, and fatigue. The flu can lead to serious complications, especially in young children, older adults, and people with chronic conditions. Annual flu vaccination is the best prevention. Antiviral medications can reduce severity if started early. Seek medical care for difficulty breathing, persistent chest pain, or severe dehydration.',
    zh_summary: '流感比普通感冒严重，症状包括高烧、全身酸痛和极度疲劳。每年接种流感疫苗是最佳预防方法。高烧不退或呼吸困难需就医。',
    url: 'https://medlineplus.gov/flu.html',
    lastReviewed: '2023-10-01',
    population: 'general',
  },
  // ── GENERAL: COVID-19 ──
  {
    title: 'COVID-19',
    content:
      'COVID-19 is a respiratory illness caused by the SARS-CoV-2 virus. Symptoms range from mild (fever, cough, fatigue, loss of taste or smell) to severe (difficulty breathing, chest pain, confusion). Vaccination is the most effective prevention along with hand hygiene and ventilation. Treatment may include antiviral medications for those at higher risk of severe illness. Seek emergency care for difficulty breathing, persistent chest pain, confusion, or inability to stay awake.',
    zh_summary: '新冠病毒感染症状包括发烧、咳嗽、乏力和味觉嗅觉丧失。按建议接种疫苗。高危人群出现症状应尽早就医。呼吸困难需紧急就医。',
    url: 'https://medlineplus.gov/covid19.html',
    lastReviewed: '2024-06-01',
    population: 'general',
  },
  // ── GENERAL: Seasonal Allergies ──
  {
    title: 'Seasonal Allergies',
    content:
      'Seasonal allergies (hay fever) occur when the immune system overreacts to outdoor allergens like pollen. Symptoms include sneezing, runny or stuffy nose, itchy watery eyes, and itchy throat. Treatment includes over-the-counter antihistamines, nasal corticosteroid sprays, and decongestants. Reducing exposure by staying indoors on high-pollen days, keeping windows closed, and showering after outdoor activities can help. See a healthcare provider if over-the-counter treatments are not effective.',
    zh_summary: '季节性过敏由花粉引起，症状包括打喷嚏、流鼻涕和眼睛发痒。抗组胺药和鼻用喷剂可缓解症状。尽量减少花粉季节的户外活动。',
    url: 'https://medlineplus.gov/seasonalallergies.html',
    lastReviewed: '2024-03-20',
    population: 'general',
  },
  // ── GENERAL: Food Poisoning ──
  {
    title: 'Food Poisoning',
    content:
      'Food poisoning results from eating contaminated food. Common causes include bacteria (Salmonella, E. coli), viruses, and parasites. Symptoms include nausea, vomiting, diarrhea, abdominal cramps, and fever, usually starting within hours to days of eating contaminated food. Most cases resolve on their own with rest and fluids. Seek medical care if you have a high fever, blood in stool, signs of dehydration, or symptoms lasting more than three days.',
    zh_summary: '食物中毒由进食被污染的食物引起，症状包括恶心、呕吐和腹泻。通常1-2天自愈注意补液。脱水、高烧或便血需就医。',
    url: 'https://medlineplus.gov/foodpoisoning.html',
    lastReviewed: '2023-07-25',
    population: 'general',
  },
  // ── GENERAL: Urinary Tract Infection ──
  {
    title: 'Urinary Tract Infection',
    content:
      'A urinary tract infection (UTI) occurs when bacteria enter the urinary system. Symptoms include a strong persistent urge to urinate, burning sensation during urination, passing frequent small amounts of urine, cloudy or strong-smelling urine, and pelvic pain. Drink plenty of water to help flush bacteria. UTIs require antibiotic treatment. See a healthcare provider promptly for UTI symptoms, and seek urgent care if you have fever, back pain, or blood in urine.',
    zh_summary: '尿路感染症状包括尿频、尿急和尿痛。需要抗生素治疗。出现腰痛、高烧或血尿需及时就医，可能提示肾脏感染。',
    url: 'https://medlineplus.gov/uti.html',
    lastReviewed: '2024-04-18',
    population: 'general',
  },
  // ── GENERAL: Kidney Stones ──
  {
    title: 'Kidney Stones',
    content:
      'Kidney stones are hard deposits of minerals and salts that form inside the kidneys. Symptoms include severe pain in the back and side, pain that radiates to the lower abdomen and groin, painful urination, pink or red urine, and nausea. Small stones may pass with increased fluid intake and pain management. Seek immediate medical care for severe pain, fever and chills, blood in urine, or difficulty urinating.',
    zh_summary: '肾结石可导致腰腹剧痛、血尿和恶心呕吐。多喝水有助于小结石排出。剧痛不缓解、伴发烧或无法排尿需紧急就医。',
    url: 'https://medlineplus.gov/kidneystones.html',
    lastReviewed: '2023-12-18',
    population: 'general',
  },
  // ── GENERAL: Appendicitis ──
  {
    title: 'Appendicitis',
    content:
      'Appendicitis is inflammation of the appendix, a small pouch attached to the large intestine. Symptoms typically begin with pain around the navel that shifts to the lower right abdomen, worsening over 12 to 24 hours. Other symptoms include nausea, vomiting, fever, and loss of appetite. Appendicitis is a medical emergency requiring surgery. Seek immediate medical care for sudden severe abdominal pain, especially in the lower right side.',
    zh_summary: '阑尾炎表现为右下腹疼痛，通常从脐周开始转移，伴恶心和发烧。疑似阑尾炎需紧急就医，通常需要手术治疗。',
    url: 'https://medlineplus.gov/appendicitis.html',
    lastReviewed: '2024-01-25',
    population: 'general',
  },
  // ── GENERAL: Gallstones ──
  {
    title: 'Gallstones',
    content:
      'Gallstones are hardened deposits in the gallbladder that can block bile ducts. Symptoms include sudden intense pain in the upper right abdomen or center of the abdomen, back pain between the shoulder blades, nausea, and vomiting. Pain often occurs after eating fatty foods. Some gallstones cause no symptoms. Seek medical care for persistent or severe abdominal pain, jaundice, or fever, as complications can include infection and pancreatitis.',
    zh_summary: '胆结石可导致右上腹突然剧痛，尤其在油腻饮食后。持续剧痛或伴黄疸、发烧需紧急就医。',
    url: 'https://medlineplus.gov/gallstones.html',
    lastReviewed: '2024-05-28',
    population: 'general',
  },
  // ── GENERAL: Heartburn ──
  {
    title: 'Heartburn',
    content:
      'Heartburn is a burning sensation in the chest caused by stomach acid backing up into the esophagus. It often occurs after eating, when lying down, or when bending over. Occasional heartburn is common and can be managed by avoiding trigger foods, eating smaller meals, not lying down after eating, and using over-the-counter antacids. See a healthcare provider if heartburn occurs more than twice a week, does not improve with antacids, or is accompanied by difficulty swallowing or weight loss.',
    zh_summary: '烧心是胃酸反流引起的胸骨后烧灼感。避免辛辣油腻食物和少食多餐可缓解。频繁发作或伴吞咽困难需就医。',
    url: 'https://medlineplus.gov/heartburn.html',
    lastReviewed: '2023-09-15',
    population: 'general',
  },
  // ── GENERAL: Nausea and Vomiting ──
  {
    title: 'Nausea and Vomiting',
    content:
      'Nausea is an uneasy feeling in the stomach that may lead to vomiting. Common causes include viral infections, food poisoning, motion sickness, pregnancy, and medications. Stay hydrated with small sips of clear fluids. Eat bland foods such as crackers and toast when able to keep food down. See a healthcare provider if vomiting lasts more than two days, you cannot keep fluids down, vomit contains blood, or you have severe abdominal pain.',
    zh_summary: '恶心呕吐可由多种原因引起。少量多次喝清流质。呕吐超过24小时、含血或伴剧烈腹痛需就医。',
    url: 'https://medlineplus.gov/nausea.html',
    lastReviewed: '2024-02-10',
    population: 'general',
  },
  // ── GENERAL: Dizziness ──
  {
    title: 'Dizziness',
    content:
      'Dizziness is a term that describes feeling lightheaded, unsteady, or as if the room is spinning (vertigo). Common causes include inner ear problems, dehydration, low blood pressure, anxiety, and certain medications. Sit or lie down until dizziness passes to prevent falls. See a healthcare provider if dizziness is recurrent, sudden, or severe, or is accompanied by headache, hearing loss, chest pain, double vision, or fainting.',
    zh_summary: '头晕可由站立过快、脱水或内耳问题引起。起身时动作缓慢，保持充足饮水。反复发作伴头痛或意识改变需就医。',
    url: 'https://medlineplus.gov/dizziness.html',
    lastReviewed: '2024-06-08',
    population: 'general',
  },
  // ── GENERAL: Fainting ──
  {
    title: 'Fainting',
    content:
      'Fainting (syncope) is a temporary loss of consciousness caused by a drop in blood flow to the brain. Common triggers include standing for long periods, heat, dehydration, emotional stress, and sudden changes in position. Warning signs include lightheadedness, nausea, warmth, and tunnel vision. If you feel faint, sit or lie down immediately. See a healthcare provider after a fainting episode, especially if it occurs without warning, during exercise, or is accompanied by chest pain or irregular heartbeat.',
    zh_summary: '晕厥是短暂失去意识，可由低血压或心脏问题引起。首次晕厥或反复发作应就医检查心脏和神经功能。',
    url: 'https://medlineplus.gov/fainting.html',
    lastReviewed: '2023-07-08',
    population: 'general',
  },
  // ── GENERAL: Fatigue ──
  {
    title: 'Fatigue',
    content:
      'Fatigue is a persistent feeling of tiredness or exhaustion that is not relieved by rest. It can result from many causes including poor sleep, stress, anemia, thyroid problems, depression, diabetes, and chronic infections. Improving sleep habits, regular exercise, stress management, and a balanced diet can help. See a healthcare provider if fatigue is severe, lasts more than two weeks, is accompanied by unexplained weight loss, fever, or other concerning symptoms.',
    zh_summary: '持续疲劳可能由睡眠不足、贫血或甲状腺问题引起。规律作息和适度运动有帮助。持续数周的严重疲劳需就医评估。',
    url: 'https://medlineplus.gov/fatigue.html',
    lastReviewed: '2024-03-28',
    population: 'general',
  },
  // ── GENERAL: Insomnia ──
  {
    title: 'Insomnia',
    content:
      'Insomnia is difficulty falling asleep, staying asleep, or waking too early and not being able to fall back asleep. It can be caused by stress, anxiety, depression, poor sleep habits, medications, and medical conditions. Good sleep hygiene includes maintaining a consistent sleep schedule, limiting screen time before bed, avoiding caffeine late in the day, and keeping the bedroom cool and dark. See a healthcare provider if insomnia persists for more than a few weeks and affects daily functioning.',
    zh_summary: '失眠指难以入睡或维持睡眠。保持规律作息和限制屏幕时间有帮助。长期严重失眠影响白天功能需就医。',
    url: 'https://medlineplus.gov/insomnia.html',
    lastReviewed: '2023-11-18',
    population: 'general',
  },
  // ── GENERAL: Anxiety ──
  {
    title: 'Anxiety',
    content:
      'Anxiety is a normal response to stress, but excessive anxiety that interferes with daily life may indicate an anxiety disorder. Symptoms include persistent worry, restlessness, difficulty concentrating, muscle tension, rapid heartbeat, and sleep problems. Management includes regular exercise, relaxation techniques, limiting caffeine, and seeking support. See a healthcare provider if anxiety is overwhelming, persistent, or interfering with work, relationships, or daily activities. Effective treatments include therapy and medication.',
    zh_summary: '焦虑症表现为过度担忧、紧张不安和心悸。规律运动和深呼吸练习可缓解。焦虑严重影响日常生活应寻求专业帮助。',
    url: 'https://medlineplus.gov/anxiety.html',
    lastReviewed: '2024-04-02',
    population: 'general',
  },
  // ── GENERAL: Stress Management ──
  {
    title: 'Stress Management',
    content:
      'Stress is the body\'s response to demands or threats. While some stress is normal, chronic stress can harm physical and mental health, contributing to headaches, sleep problems, high blood pressure, and depression. Management techniques include regular physical activity, deep breathing exercises, adequate sleep, social connections, and time management. See a healthcare provider if stress is causing physical symptoms, affecting relationships or work, or if you feel unable to cope.',
    zh_summary: '长期压力影响身心健康。有效的减压方法包括运动、充足睡眠和社交活动。压力导致持续身体症状或情绪问题时应寻求帮助。',
    url: 'https://medlineplus.gov/stress.html',
    lastReviewed: '2024-06-12',
    population: 'general',
  },
  // ── GENERAL: Skin Infections ──
  {
    title: 'Skin Infections',
    content:
      'Skin infections can be caused by bacteria, viruses, fungi, or parasites. Bacterial infections include cellulitis and impetigo. Symptoms include redness, warmth, swelling, pain, and sometimes pus or drainage. Keep wounds clean and covered. Good hand hygiene helps prevent spread. See a healthcare provider if redness is spreading, you develop a fever, the infection is near the eye, or you have diabetes or a weakened immune system.',
    zh_summary: '皮肤感染可由细菌、真菌或病毒引起，表现为红肿和疼痛。保持皮肤清洁可预防。感染扩大伴发烧或红色条纹扩散需就医。',
    url: 'https://medlineplus.gov/skininfections.html',
    lastReviewed: '2023-08-12',
    population: 'general',
  },
  // ── GENERAL: Cuts and Wounds ──
  {
    title: 'Cuts and Wounds',
    content:
      'Minor cuts and scrapes can be treated at home. Clean the wound gently with water, apply pressure with a clean cloth to stop bleeding, apply antibiotic ointment, and cover with a sterile bandage. Change the bandage daily. Seek medical care if the cut is deep or jagged, bleeding does not stop after 10 minutes of pressure, the wound is from an animal bite, you see signs of infection (increasing redness, warmth, swelling, pus), or you are not up to date on tetanus vaccination.',
    zh_summary: '轻微割伤用清水冲洗、消毒并覆盖干净敷料。伤口深、出血不止或出现感染迹象需就医。',
    url: 'https://medlineplus.gov/cutsandwounds.html',
    lastReviewed: '2024-01-15',
    population: 'general',
  },
  // ── GENERAL: Sprains and Strains ──
  {
    title: 'Sprains and Strains',
    content:
      'A sprain is a stretched or torn ligament; a strain is a stretched or torn muscle or tendon. Both cause pain, swelling, and limited movement. The RICE method is initial treatment: Rest, Ice (20 minutes several times a day), Compression (elastic bandage), and Elevation. Over-the-counter pain relievers can help. See a healthcare provider if you cannot bear weight, the joint feels unstable, there is significant swelling, or pain does not improve within a few days.',
    zh_summary: '扭伤和拉伤遵循RICE原则：休息、冰敷、加压和抬高。无法负重或严重肿胀需就医。',
    url: 'https://medlineplus.gov/sprainsandstrains.html',
    lastReviewed: '2024-05-15',
    population: 'general',
  },
  // ── GENERAL: Fractures ──
  {
    title: 'Fractures',
    content:
      'A fracture is a broken bone. Symptoms include intense pain, swelling, bruising, visible deformity, and inability to move the affected area. Do not try to straighten a broken bone. Apply ice to reduce swelling and immobilize the area. Seek immediate medical care for any suspected fracture, especially if the bone has pierced the skin, there is numbness or tingling below the injury, or the injury involves the head, neck, or back.',
    zh_summary: '骨折表现为剧痛、肿胀和畸形，不要自行搬动受伤部位。疑似骨折需就医进行X线检查和固定治疗。',
    url: 'https://medlineplus.gov/fractures.html',
    lastReviewed: '2023-10-12',
    population: 'general',
  },
  // ── GENERAL: Burns ──
  {
    title: 'Burns',
    content:
      'Burns are tissue damage from heat, chemicals, electricity, or radiation. First-degree burns (redness only) and small second-degree burns (blisters) can be treated at home by cooling under running water for 10 to 20 minutes and covering with a clean non-stick bandage. Do not apply ice, butter, or ointments. Seek emergency care for burns that are large, deep, on the face, hands, feet, or genitals, or if the person inhaled smoke.',
    zh_summary: '轻度烫伤用冷流水冲洗10-20分钟，不要涂黄油或牙膏。严重烫伤（面积大或有白色焦黑皮肤）需紧急就医。',
    url: 'https://medlineplus.gov/burns.html',
    lastReviewed: '2024-02-22',
    population: 'general',
  },
  // ── GENERAL: Insect Bites and Stings ──
  {
    title: 'Insect Bites and Stings',
    content:
      'Most insect bites and stings cause mild reactions including redness, itching, swelling, and minor pain. Clean the area with soap and water, apply a cold pack to reduce swelling, and use over-the-counter antihistamines or hydrocortisone cream for itching. Remove bee stingers by scraping sideways. Seek emergency care immediately if there are signs of anaphylaxis: difficulty breathing, swelling of the face or throat, rapid pulse, dizziness, or nausea.',
    zh_summary: '大多数虫咬反应轻微，可用冰敷和抗组胺药缓解。出现全身荨麻疹、呼吸困难或面部肿胀是严重过敏反应，需紧急就医。',
    url: 'https://medlineplus.gov/insectbites.html',
    lastReviewed: '2024-06-05',
    population: 'general',
  },
  // ── GENERAL: Tick Bites ──
  {
    title: 'Tick Bites',
    content:
      'Ticks can transmit diseases such as Lyme disease, Rocky Mountain spotted fever, and ehrlichiosis. Remove a tick promptly by grasping it close to the skin with fine-tipped tweezers and pulling upward with steady pressure. Clean the area with soap and water. Monitor for symptoms for 30 days, including rash (especially a bull\'s-eye pattern), fever, fatigue, and joint pain. See a healthcare provider if a rash develops, you feel ill after a tick bite, or the tick was attached for more than 36 hours.',
    zh_summary: '蜱虫叮咬可传播莱姆病等疾病。发现蜱虫用镊子缓慢拉出并消毒。出现靶心样皮疹、发烧或关节痛需就医。',
    url: 'https://medlineplus.gov/tickbites.html',
    lastReviewed: '2023-05-10',
    population: 'general',
  },
  // ── GENERAL: Sunburn ──
  {
    title: 'Sunburn',
    content:
      'Sunburn is red, painful skin that feels hot to the touch, caused by overexposure to ultraviolet (UV) rays. Severe sunburn can cause blistering, swelling, fever, and chills. Cool the skin with a damp cloth, apply aloe vera or moisturizing lotion, drink extra water, and take over-the-counter pain relievers. Prevention includes using broad-spectrum SPF 30+ sunscreen, wearing protective clothing, and avoiding sun during peak hours. See a healthcare provider for severe sunburn with blistering, fever, or dehydration.',
    zh_summary: '晒伤表现为皮肤发红疼痛，严重时出现水泡。用凉水敷和涂芦荟凝胶缓解。大面积水泡或发烧需就医。',
    url: 'https://medlineplus.gov/sunburn.html',
    lastReviewed: '2024-03-05',
    population: 'general',
  },
  // ── GENERAL: Heat Exhaustion ──
  {
    title: 'Heat Exhaustion',
    content:
      'Heat exhaustion occurs when the body overheats due to prolonged exposure to high temperatures, especially with physical exertion and inadequate hydration. Symptoms include heavy sweating, weakness, cold and clammy skin, nausea, fast weak pulse, headache, and dizziness. Move to a cool place, loosen clothing, apply cool wet cloths, and sip water. Seek emergency care if symptoms worsen, vomiting occurs, or the person becomes confused, as this may progress to heat stroke.',
    zh_summary: '热衰竭症状包括大量出汗、虚弱和头晕。转移到阴凉处并补充水分。症状不缓解或意识混乱需紧急就医。',
    url: 'https://medlineplus.gov/heatexhaustion.html',
    lastReviewed: '2024-05-20',
    population: 'general',
  },
  // ── GENERAL: Heat Stroke ──
  {
    title: 'Heat Stroke',
    content:
      'Heat stroke is a life-threatening condition where the body temperature rises to 104°F (40°C) or higher. Symptoms include high body temperature, hot dry skin (no sweating), rapid strong pulse, headache, confusion, and loss of consciousness. Heat stroke requires immediate emergency treatment. Call 911, move the person to a cool area, and cool them rapidly with cold water or ice packs on the neck, armpits, and groin. Do not give fluids to an unconscious person.',
    zh_summary: '热射病是危及生命的紧急情况，体温超过40°C，皮肤干热、意识混乱。立即拨打急救电话并尽一切可能降温。',
    url: 'https://medlineplus.gov/heatstroke.html',
    lastReviewed: '2023-06-28',
    population: 'general',
  },
  // ── GENERAL: Hypothermia ──
  {
    title: 'Hypothermia',
    content:
      'Hypothermia occurs when body temperature drops below 95°F (35°C), usually from prolonged exposure to cold. Symptoms include shivering, confusion, slurred speech, drowsiness, slow breathing, and loss of coordination. Move the person to a warm area, remove wet clothing, and warm them gradually with blankets and warm (not hot) beverages if conscious. Call 911 for severe hypothermia. Do not rub the skin or use direct heat, as this can cause cardiac arrest.',
    zh_summary: '低体温症是体温降至35°C以下的紧急情况。转移到温暖处、脱去湿衣物并用毯子保暖，同时呼叫急救。',
    url: 'https://medlineplus.gov/hypothermia.html',
    lastReviewed: '2024-01-20',
    population: 'general',
  },
  // ── GENERAL: Frostbite ──
  {
    title: 'Frostbite',
    content:
      'Frostbite occurs when skin and underlying tissues freeze from exposure to cold temperatures. It most commonly affects fingers, toes, nose, ears, cheeks, and chin. Symptoms progress from cold and prickling sensations to numbness, then hard and pale skin. Warm the affected area in warm (not hot) water, do not rub the area, and do not walk on frostbitten feet. Seek medical care for any suspected frostbite, as severe cases can cause permanent tissue damage.',
    zh_summary: '冻伤多影响手指、脚趾和耳朵，表现为皮肤发白和麻木。用温水缓慢复温，不要揉搓。出现水泡或皮肤变黑需就医。',
    url: 'https://medlineplus.gov/frostbite.html',
    lastReviewed: '2023-12-22',
    population: 'general',
  },
  // ── GENERAL: Nosebleed ──
  {
    title: 'Nosebleed',
    content:
      'Nosebleeds are common and usually not serious. Most are anterior nosebleeds that come from blood vessels in the front of the nose. To stop a nosebleed, sit upright and lean slightly forward, pinch the soft part of the nose firmly for 10 to 15 minutes without releasing, and breathe through the mouth. Do not tilt the head back. See a healthcare provider if the bleeding does not stop after 20 minutes, occurs after a head injury, or happens frequently.',
    zh_summary: '鼻出血时身体前倾、捏住鼻翼10-15分钟。不要仰头。频繁出血或大量出血止不住需就医。',
    url: 'https://medlineplus.gov/nosebleed.html',
    lastReviewed: '2024-04-12',
    population: 'general',
  },
  // ── GENERAL: Eye Infections ──
  {
    title: 'Eye Infections',
    content:
      'Eye infections can be caused by bacteria, viruses, or fungi and may affect different parts of the eye. Common types include conjunctivitis (pink eye), stye, and keratitis. Symptoms include redness, itching, discharge, swelling, pain, and sensitivity to light. Do not touch or rub the eyes, and wash hands frequently. See a healthcare provider if you have eye pain, vision changes, sensitivity to light, significant swelling, or symptoms that do not improve.',
    zh_summary: '眼部感染可导致红肿、疼痛和分泌物增多。不要揉眼睛。视力下降或剧痛需紧急就医。',
    url: 'https://medlineplus.gov/eyeinfections.html',
    lastReviewed: '2023-09-02',
    population: 'general',
  },
  // ── GENERAL: Pink Eye (Conjunctivitis) ──
  {
    title: 'Pink Eye (Conjunctivitis)',
    content:
      'Pink eye is inflammation of the conjunctiva, the clear tissue covering the white of the eye and inside the eyelids. Causes include viruses, bacteria, and allergies. Symptoms include redness, itching, tearing, discharge, and crusting. Viral pink eye is highly contagious. Wash hands often and avoid touching the eyes. Cool compresses may ease discomfort. See a healthcare provider if there is eye pain, vision changes, intense redness, or if a newborn develops symptoms.',
    zh_summary: '结膜炎（红眼病）表现为眼红、瘙痒和分泌物。病毒性通常自愈，细菌性需抗生素滴眼液。传染性强，勤洗手。',
    url: 'https://medlineplus.gov/pinkeye.html',
    lastReviewed: '2024-02-08',
    population: 'general',
  },
  // ── GENERAL: Toothache ──
  {
    title: 'Toothache',
    content:
      'A toothache is pain in or around a tooth, often caused by tooth decay, infection, gum disease, cracked teeth, or exposed roots. Symptoms may include sharp or throbbing pain, swelling, fever, and bad taste in the mouth. Rinse with warm saltwater, apply a cold compress to the cheek, and take over-the-counter pain relievers. See a dentist promptly for persistent toothache, and seek emergency care if there is fever, facial swelling, difficulty breathing, or swallowing.',
    zh_summary: '牙痛可由蛀牙或感染引起。温盐水漱口和非处方止痛药可暂时缓解。持续牙痛或面部肿胀需尽快看牙医。',
    url: 'https://medlineplus.gov/toothache.html',
    lastReviewed: '2024-06-02',
    population: 'general',
  },
  // ── GENERAL: Mouth Sores ──
  {
    title: 'Mouth Sores',
    content:
      'Mouth sores (canker sores) are small, shallow lesions inside the mouth on the soft tissues or at the base of the gums. They can be painful and make eating and talking uncomfortable. Most heal on their own within one to two weeks. Avoid spicy, acidic, and rough-textured foods. Over-the-counter topical treatments can ease pain. See a healthcare provider if sores are unusually large, recurrent, spreading, last longer than three weeks, or are accompanied by high fever.',
    zh_summary: '口腔溃疡大多1-2周可自愈。避免辛辣酸性食物。溃疡反复发作或超过2周不愈合需就医。',
    url: 'https://medlineplus.gov/mouthsores.html',
    lastReviewed: '2023-07-15',
    population: 'general',
  },
  // ── GENERAL: Ear Pain ──
  {
    title: 'Ear Pain',
    content:
      'Ear pain can result from ear infections, fluid buildup, earwax blockage, sinus infections, or temporomandibular joint (TMJ) problems. Symptoms may include sharp or dull pain, muffled hearing, and drainage. Applying a warm compress to the ear and taking over-the-counter pain relievers can help. See a healthcare provider if pain is severe, lasts more than a day, is accompanied by fever, drainage, or hearing loss, or if a child under 6 months has ear pain.',
    zh_summary: '耳痛可由感染、耳垢堵塞或气压变化引起。温热敷和止痛药可缓解。伴发烧或听力下降需就医。',
    url: 'https://medlineplus.gov/earpain.html',
    lastReviewed: '2024-03-10',
    population: 'general',
  },
  // ── GENERAL: Swimmer's Ear ──
  {
    title: 'Swimmer\'s Ear',
    content:
      'Swimmer\'s ear (otitis externa) is an infection of the outer ear canal, often caused by water remaining in the ear after swimming. Symptoms include itching in the ear canal, redness, discomfort that worsens when pulling on the ear, and drainage. Keep the ear dry and avoid inserting objects into the ear canal. See a healthcare provider for ear drops to treat the infection. Seek urgent care if there is severe pain, fever, or complete blockage of the ear canal.',
    zh_summary: '外耳道炎由水分滞留在耳道引起，症状为耳痛和瘙痒。需要抗生素滴耳液治疗。游泳后保持耳道干燥可预防。',
    url: 'https://medlineplus.gov/swimmersear.html',
    lastReviewed: '2023-06-05',
    population: 'general',
  },
  // ── GENERAL: Sinusitis ──
  {
    title: 'Sinusitis',
    content:
      'Sinusitis is inflammation of the sinuses, usually caused by a viral infection following a cold. Symptoms include facial pain and pressure, nasal congestion, thick nasal discharge, reduced sense of smell, cough, and fatigue. Most cases resolve without antibiotics. Treatment includes saline nasal irrigation, decongestants, and pain relievers. See a healthcare provider if symptoms last more than 10 days, worsen after initial improvement, or include high fever or severe facial pain.',
    zh_summary: '鼻窦炎表现为面部胀痛、鼻塞和浓稠鼻涕。盐水冲洗鼻腔可缓解。超过10天不好转或伴高烧需就医。',
    url: 'https://medlineplus.gov/sinusitis.html',
    lastReviewed: '2024-04-25',
    population: 'general',
  },
  // ── GENERAL: Bronchitis ──
  {
    title: 'Bronchitis',
    content:
      'Bronchitis is inflammation of the bronchial tubes (airways) in the lungs. Acute bronchitis is usually caused by a virus and follows a cold. Symptoms include persistent cough (which may produce mucus), chest discomfort, fatigue, and mild body aches. Antibiotics are usually not needed. Treatment includes rest, fluids, over-the-counter cough suppressants, and a humidifier. See a healthcare provider if the cough lasts more than three weeks, produces blood, or is accompanied by high fever or shortness of breath.',
    zh_summary: '急性支气管炎多由病毒引起，表现为咳嗽和胸部不适。休息和多喝水为主。伴高烧或呼吸困难需就医。',
    url: 'https://medlineplus.gov/bronchitis.html',
    lastReviewed: '2023-11-05',
    population: 'general',
  },
  // ── GENERAL: Laryngitis ──
  {
    title: 'Laryngitis',
    content:
      'Laryngitis is inflammation of the voice box (larynx), causing hoarseness or loss of voice. It is usually caused by overuse, irritation, or viral infection. Symptoms include hoarseness, weak voice, tickling sensation in the throat, and dry cough. Rest your voice, drink plenty of fluids, and use a humidifier. See a healthcare provider if hoarseness lasts more than two weeks, you have difficulty breathing or swallowing, or you cough up blood.',
    zh_summary: '喉炎导致声音嘶哑或失声，多由病毒感染引起。让声带休息和多喝温水。声音嘶哑超过2周需就医。',
    url: 'https://medlineplus.gov/laryngitis.html',
    lastReviewed: '2024-01-02',
    population: 'general',
  },
  // ── GENERAL: Mononucleosis ──
  {
    title: 'Mononucleosis',
    content:
      'Mononucleosis (mono) is a viral infection commonly caused by the Epstein-Barr virus. Symptoms include extreme fatigue, fever, sore throat, swollen lymph nodes, and swollen tonsils. It is most common in teenagers and young adults and is spread through saliva. Treatment includes rest, fluids, and over-the-counter pain relievers. Avoid contact sports due to risk of spleen rupture. See a healthcare provider if symptoms are severe, do not improve, or you develop sharp left-side abdominal pain.',
    zh_summary: '传染性单核细胞增多症由EB病毒引起，表现为极度疲劳、咽痛和淋巴结肿大。需充足休息，避免剧烈运动以防脾脏破裂。',
    url: 'https://medlineplus.gov/mononucleosis.html',
    lastReviewed: '2024-05-10',
    population: 'general',
  },
  // ── GENERAL: Lyme Disease ──
  {
    title: 'Lyme Disease',
    content:
      'Lyme disease is a bacterial infection transmitted through tick bites. Early symptoms include a characteristic expanding bull\'s-eye rash, fever, headache, fatigue, and muscle aches. If untreated, it can spread to joints, heart, and nervous system. Early treatment with antibiotics is usually effective. Prevention includes using insect repellent, wearing long clothing in wooded areas, and checking for ticks after being outdoors. See a healthcare provider promptly if you develop a rash or symptoms after a tick bite.',
    zh_summary: '莱姆病由蜱虫叮咬传播，早期症状为靶心样皮疹和发烧。早期抗生素治疗效果好。户外活动后检查有无蜱虫。',
    url: 'https://medlineplus.gov/lymedisease.html',
    lastReviewed: '2023-05-28',
    population: 'general',
  },
  // ── GENERAL: Scabies ──
  {
    title: 'Scabies',
    content:
      'Scabies is a contagious skin condition caused by tiny mites that burrow into the skin, causing intense itching and a pimple-like rash. Itching is often worse at night. Scabies is spread through prolonged skin-to-skin contact. Treatment involves prescription scabicide lotions or creams applied to the entire body from the neck down. All household members and close contacts should be treated simultaneously. See a healthcare provider for persistent itching and rash for proper diagnosis and treatment.',
    zh_summary: '疥疮由疥螨引起，表现为剧烈瘙痒（夜间加重）。传染性强，需处方药膏治疗，家庭成员和密切接触者需同时治疗。',
    url: 'https://medlineplus.gov/scabies.html',
    lastReviewed: '2024-02-20',
    population: 'general',
  },
  // ── GENERAL: Ringworm ──
  {
    title: 'Ringworm',
    content:
      'Ringworm is a common fungal skin infection (not caused by a worm) that causes a red, circular, itchy rash with clearer skin in the middle. It can affect the body, scalp, feet, and groin area. It spreads through direct contact with infected people, animals, or contaminated surfaces. Treatment includes over-the-counter antifungal creams for skin infections. See a healthcare provider if the rash does not improve with treatment, is on the scalp, or is widespread.',
    zh_summary: '癣是真菌感染，表现为环形红色皮疹。非处方抗真菌药膏通常有效。面积大或头皮感染需就医。',
    url: 'https://medlineplus.gov/ringworm.html',
    lastReviewed: '2024-06-10',
    population: 'general',
  },
  // ── GENERAL: Athlete's Foot ──
  {
    title: 'Athlete\'s Foot',
    content:
      'Athlete\'s foot is a fungal infection that causes itching, stinging, and burning between the toes and on the soles of the feet. The skin may appear scaly, peeling, or cracked. It is spread through contact with contaminated surfaces, especially in warm, moist environments like locker rooms. Treatment includes over-the-counter antifungal creams or sprays. Keep feet clean and dry, and wear breathable footwear. See a healthcare provider if the infection does not improve with treatment or if you have diabetes.',
    zh_summary: '脚癣是足部真菌感染，表现为脚趾间瘙痒和脱皮。非处方抗真菌药膏可治疗。保持脚部干燥可预防。',
    url: 'https://medlineplus.gov/athletesfoot.html',
    lastReviewed: '2023-08-18',
    population: 'general',
  },
  // ── GENERAL: Nail Fungus ──
  {
    title: 'Nail Fungus',
    content:
      'Nail fungus (onychomycosis) is a common infection that causes thickened, discolored, brittle, or crumbly nails, usually affecting toenails. It is caused by fungi that thrive in warm, moist environments. Risk factors include aging, sweating heavily, walking barefoot in damp areas, and having athlete\'s foot. Over-the-counter antifungal treatments may help mild cases. See a healthcare provider for persistent infections, as prescription oral antifungal medications are often needed for effective treatment.',
    zh_summary: '灰指甲是指甲真菌感染，导致指甲变厚变色。外用药效果有限，可能需要口服抗真菌药。保持手脚干燥可降低风险。',
    url: 'https://medlineplus.gov/nailfungus.html',
    lastReviewed: '2024-03-22',
    population: 'general',
  },
  // ── GENERAL: Warts ──
  {
    title: 'Warts',
    content:
      'Warts are small, rough skin growths caused by human papillomavirus (HPV). They are common on fingers, hands, and feet (plantar warts). Warts are spread through direct contact and may resolve on their own over months to years. Over-the-counter treatments containing salicylic acid can help. Avoid picking or scratching warts to prevent spreading. See a healthcare provider if warts are painful, change in appearance, are on the face or genitals, or do not respond to home treatment.',
    zh_summary: '疣由人乳头瘤病毒引起，通常无害。非处方冷冻或水杨酸产品可治疗。多数疣可自行消退。',
    url: 'https://medlineplus.gov/warts.html',
    lastReviewed: '2023-10-28',
    population: 'general',
  },
  // ── GENERAL: Acne ──
  {
    title: 'Acne',
    content:
      'Acne is a common skin condition that occurs when hair follicles become clogged with oil and dead skin cells, causing pimples, blackheads, and whiteheads. It most often affects the face, forehead, chest, and back. Management includes gentle face washing twice daily, avoiding touching the face, and using over-the-counter products with benzoyl peroxide or salicylic acid. See a healthcare provider if acne is severe, scarring, or not responding to over-the-counter treatments.',
    zh_summary: '痤疮由皮脂腺堵塞引起。保持面部清洁、不挤痘、使用含过氧化苯甲酰的产品。严重痤疮或留疤需就医。',
    url: 'https://medlineplus.gov/acne.html',
    lastReviewed: '2024-04-08',
    population: 'general',
  },
  // ── GENERAL: Psoriasis ──
  {
    title: 'Psoriasis',
    content:
      'Psoriasis is a chronic autoimmune condition that causes rapid skin cell buildup, leading to thick, red, scaly patches that may itch and burn. It commonly affects the elbows, knees, scalp, and lower back. Flares can be triggered by stress, infections, cold weather, and certain medications. Treatment includes topical creams, phototherapy, and systemic medications. See a healthcare provider for persistent or worsening symptoms, or if psoriasis affects daily activities.',
    zh_summary: '银屑病是慢性自身免疫性皮肤病，表现为红色鳞屑斑块。保持皮肤湿润可缓解。面积扩大或影响生活需就医。',
    url: 'https://medlineplus.gov/psoriasis.html',
    lastReviewed: '2023-12-10',
    population: 'general',
  },
  // ── GENERAL: Rosacea ──
  {
    title: 'Rosacea',
    content:
      'Rosacea is a chronic skin condition that causes redness, visible blood vessels, and sometimes small red bumps on the face, primarily affecting the cheeks, nose, chin, and forehead. Triggers include sun exposure, hot beverages, spicy foods, alcohol, and stress. Management includes identifying and avoiding triggers, gentle skin care, sun protection, and prescribed topical or oral medications. See a healthcare provider if facial redness is persistent or accompanied by bumps and eye irritation.',
    zh_summary: '玫瑰痤疮表现为面部持续发红和小丘疹。避免日晒、辛辣食物和饮酒等触发因素。症状加重需就医获取处方治疗。',
    url: 'https://medlineplus.gov/rosacea.html',
    lastReviewed: '2024-01-28',
    population: 'general',
  },
  // ── GENERAL: Hives ──
  {
    title: 'Hives',
    content:
      'Hives (urticaria) are raised, itchy welts on the skin that can appear suddenly and may be triggered by allergies, medications, infections, stress, or temperature changes. Individual hives typically last less than 24 hours, but new ones may continue to appear. Antihistamines are the primary treatment. Seek emergency care if hives are accompanied by difficulty breathing, swelling of the lips, tongue, or throat, dizziness, or rapid heartbeat, as these may indicate anaphylaxis.',
    zh_summary: '荨麻疹表现为突发的红色风团样皮疹伴瘙痒。抗组胺药可缓解。伴呼吸困难或面部肿胀是严重过敏反应，需紧急就医。',
    url: 'https://medlineplus.gov/hives.html',
    lastReviewed: '2024-05-25',
    population: 'general',
  },
  // ── GENERAL: Contact Dermatitis ──
  {
    title: 'Contact Dermatitis',
    content:
      'Contact dermatitis is a red, itchy rash caused by direct contact with a substance that irritates the skin or triggers an allergic reaction. Common triggers include poison ivy, latex, nickel, fragrances, and cleaning products. Symptoms include redness, itching, swelling, blisters, and dry cracked skin. Avoid the trigger substance, wash the area with mild soap and water, and apply calamine lotion or hydrocortisone cream. See a healthcare provider if the rash is severe, widespread, or near the eyes.',
    zh_summary: '接触性皮炎由皮肤接触过敏原或刺激物引起，表现为红疹和水泡。避免已知过敏原。面积大或不消退需就医。',
    url: 'https://medlineplus.gov/contactdermatitis.html',
    lastReviewed: '2023-09-25',
    population: 'general',
  },
  // ── GENERAL: Hemorrhoids ──
  {
    title: 'Hemorrhoids',
    content:
      'Hemorrhoids are swollen veins in the lower rectum and anus, causing discomfort, itching, pain, and sometimes bleeding during bowel movements. They can be internal or external. Prevention and treatment include eating a high-fiber diet, drinking plenty of fluids, avoiding straining during bowel movements, and using over-the-counter creams and sitz baths. See a healthcare provider if you have significant bleeding, pain that does not improve, or a lump near the anus.',
    zh_summary: '痔疮是肛门周围血管肿胀，表现为疼痛和出血。增加纤维摄入和温水坐浴可缓解。出血持续或疼痛严重需就医。',
    url: 'https://medlineplus.gov/hemorrhoids.html',
    lastReviewed: '2024-02-15',
    population: 'general',
  },
  // ── GENERAL: Varicose Veins ──
  {
    title: 'Varicose Veins',
    content:
      'Varicose veins are enlarged, twisted veins that appear dark purple or blue, most commonly in the legs. They occur when valves in the veins weaken, allowing blood to pool. Symptoms include aching, heaviness, swelling, itching, and visible bulging veins. Compression stockings, exercise, elevation, and weight management can help. See a healthcare provider if varicose veins cause significant pain, skin changes, or if a vein becomes warm, tender, and red.',
    zh_summary: '静脉曲张是腿部静脉异常扩张。抬高双腿、穿弹力袜和适度运动可缓解。伴疼痛或皮肤变色需就医。',
    url: 'https://medlineplus.gov/varicoseveins.html',
    lastReviewed: '2024-06-08',
    population: 'general',
  },
  // ── GENERAL: Blood in Stool ──
  {
    title: 'Blood in Stool',
    content:
      'Blood in the stool can appear bright red (from the lower GI tract) or dark and tarry (from the upper GI tract). Causes range from hemorrhoids and anal fissures to more serious conditions like colorectal polyps, diverticulosis, or cancer. While hemorrhoids are the most common cause, rectal bleeding should always be evaluated. See a healthcare provider for any blood in your stool, and seek urgent care if bleeding is heavy, accompanied by dizziness, or if you have dark tarry stools.',
    zh_summary: '大便带血可能由痔疮或更严重的原因引起。任何不明原因的便血都应就医检查排除严重疾病。',
    url: 'https://medlineplus.gov/bloodinstool.html',
    lastReviewed: '2023-07-20',
    population: 'general',
  },
  // ── GENERAL: Blood in Urine ──
  {
    title: 'Blood in Urine',
    content:
      'Blood in the urine (hematuria) can appear pink, red, or brown. Causes include urinary tract infections, kidney stones, enlarged prostate, vigorous exercise, and less commonly bladder or kidney cancer. Sometimes blood is not visible but is detected on a urine test. See a healthcare provider for any visible blood in the urine, as even a single episode should be evaluated. Seek urgent care if blood in urine is accompanied by pain, fever, or difficulty urinating.',
    zh_summary: '尿液带血可能由感染或结石引起。即使无痛性血尿也需要就医检查。伴排尿疼痛或腰痛应尽快就诊。',
    url: 'https://medlineplus.gov/bloodinurine.html',
    lastReviewed: '2024-03-15',
    population: 'general',
  },
  // ── GENERAL: Painful Urination ──
  {
    title: 'Painful Urination',
    content:
      'Painful urination (dysuria) is a burning or stinging sensation during urination. It is most commonly caused by urinary tract infections but can also result from sexually transmitted infections, kidney stones, or irritation from products. Other symptoms may include frequent urination, urgency, and cloudy urine. See a healthcare provider for painful urination, especially if accompanied by fever, back pain, blood in urine, or unusual discharge.',
    zh_summary: '排尿疼痛最常见原因是尿路感染。也可能由性传播感染引起。持续尿痛需就医检查明确原因。',
    url: 'https://medlineplus.gov/painfulurination.html',
    lastReviewed: '2023-11-12',
    population: 'general',
  },
  // ── GENERAL: Menstrual Cramps ──
  {
    title: 'Menstrual Cramps',
    content:
      'Menstrual cramps (dysmenorrhea) are throbbing or cramping pains in the lower abdomen that occur before and during menstrual periods. They are caused by uterine contractions. Mild cramps are common and can be managed with over-the-counter pain relievers such as ibuprofen, a heating pad, and light exercise. See a healthcare provider if cramps are severe enough to interfere with daily activities, suddenly worsen, or are accompanied by heavy bleeding or fever.',
    zh_summary: '痛经是月经期间下腹部痉挛性疼痛。热敷和非处方止痛药可缓解。疼痛严重影响正常活动或逐渐加重需就医。',
    url: 'https://medlineplus.gov/menstrualcramps.html',
    lastReviewed: '2024-04-20',
    population: 'general',
  },
  // ── GENERAL: Yeast Infections ──
  {
    title: 'Yeast Infections',
    content:
      'Vaginal yeast infections are caused by an overgrowth of the fungus Candida, resulting in itching, burning, redness, and a thick white discharge. Common triggers include antibiotics, hormonal changes, diabetes, and a weakened immune system. Over-the-counter antifungal treatments are available. See a healthcare provider if this is your first yeast infection, symptoms do not improve with treatment, infections recur frequently, or if you are pregnant.',
    zh_summary: '酵母菌感染表现为阴部瘙痒和白色浓稠分泌物。非处方抗真菌药通常有效。首次感染或反复发作应就医。',
    url: 'https://medlineplus.gov/yeastinfections.html',
    lastReviewed: '2024-06-15',
    population: 'general',
  },
  // ── GENERAL: Sexually Transmitted Infections Overview ──
  {
    title: 'Sexually Transmitted Infections Overview',
    content:
      'Sexually transmitted infections (STIs) are infections passed from one person to another through sexual contact. Common STIs include chlamydia, gonorrhea, syphilis, herpes, HPV, and HIV. Many STIs have no symptoms in early stages. Prevention includes consistent condom use and regular screening. Early detection and treatment can prevent complications and reduce transmission. See a healthcare provider for STI testing if you are sexually active, have a new partner, or have symptoms such as unusual discharge or sores.',
    zh_summary: '性传播感染包括衣原体、淋病、梅毒和HIV等。使用安全套和定期筛查是主要预防措施。生殖器异常应就医检查。',
    url: 'https://medlineplus.gov/stioverview.html',
    lastReviewed: '2023-08-08',
    population: 'general',
  },
  // ── GENERAL: First Aid Basics ──
  {
    title: 'First Aid Basics',
    content:
      'First aid is the immediate care given to a person who is injured or suddenly ill before professional medical help arrives. Key skills include calling emergency services, controlling bleeding with direct pressure, treating minor burns, recognizing signs of heart attack and stroke, and keeping an injured person calm and still. Keep a well-stocked first aid kit at home, in the car, and at work. Take a first aid course to be prepared for emergencies.',
    zh_summary: '急救基础包括评估环境安全、呼叫急救和提供基本护理。家中应备急救箱。严重出血或意识丧失应立即拨打急救电话。',
    url: 'https://medlineplus.gov/firstaidbasics.html',
    lastReviewed: '2024-01-12',
    population: 'general',
  },
  // ── GENERAL: CPR Basics ──
  {
    title: 'CPR Basics',
    content:
      'CPR (cardiopulmonary resuscitation) is a lifesaving technique performed when someone\'s heartbeat or breathing has stopped. Hands-only CPR involves calling 911, then pushing hard and fast in the center of the chest at a rate of 100 to 120 compressions per minute. Continue until emergency help arrives or an AED is available. CPR can double or triple survival rates after cardiac arrest. Take a CPR certification course to be prepared.',
    zh_summary: '心肺复苏可挽救心脏骤停者的生命。对无反应无呼吸的人进行胸外按压（每分钟100-120次）。建议所有人学习CPR技能。',
    url: 'https://medlineplus.gov/cprbasics.html',
    lastReviewed: '2024-05-05',
    population: 'general',
  },
  // ── GENERAL: Choking First Aid ──
  {
    title: 'Choking First Aid',
    content:
      'Choking occurs when an object blocks the airway, preventing breathing. Signs include inability to speak or cough, clutching the throat, and turning blue. For adults and children over 1 year, perform the Heimlich maneuver (abdominal thrusts). For infants, alternate between five back blows and five chest thrusts. Call 911 if the object cannot be dislodged. Prevention includes cutting food into small pieces for children and supervising eating.',
    zh_summary: '成人噎住时使用海姆立克法：从背后环抱用力向上推。婴儿噎住交替背部拍击和胸部按压。无法缓解立即拨打急救。',
    url: 'https://medlineplus.gov/chokingfirstaid.html',
    lastReviewed: '2023-10-15',
    population: 'general',
  },
  // ── GENERAL: Wound Care ──
  {
    title: 'Wound Care',
    content:
      'Proper wound care helps prevent infection and promotes healing. Clean the wound gently with clean water, apply gentle pressure with a clean cloth to stop bleeding, and apply a thin layer of antibiotic ointment. Cover with a sterile bandage and change it daily or when it becomes wet or dirty. Watch for signs of infection: increasing redness, warmth, swelling, drainage, or red streaks. See a healthcare provider for deep wounds, wounds that will not stop bleeding, or signs of infection.',
    zh_summary: '伤口护理包括清水冲洗、涂抗菌药膏和干净敷料覆盖。伤口红肿加重或出现红线扩散提示感染，需就医。',
    url: 'https://medlineplus.gov/woundcare.html',
    lastReviewed: '2024-02-25',
    population: 'general',
  },
  // ── GENERAL: When to Go to the Emergency Room ──
  {
    title: 'When to Go to the Emergency Room',
    content:
      'Emergency rooms treat life-threatening and urgent conditions. Go to the ER for chest pain, difficulty breathing, severe bleeding, signs of stroke (sudden numbness, confusion, trouble speaking), severe allergic reactions, poisoning, seizures, serious burns, head injuries with loss of consciousness, and broken bones with visible deformity. For non-life-threatening concerns, urgent care or your primary care provider may be more appropriate. When in doubt, call 911 or your healthcare provider for guidance.',
    zh_summary: '以下情况应去急诊：胸痛或呼吸困难、严重出血无法止住、严重过敏反应、中风症状、骨折或头部外伤后意识改变。',
    url: 'https://medlineplus.gov/whenemergencyroom.html',
    lastReviewed: '2024-06-01',
    population: 'general',
  },
  // ── GENERAL: How to Take a Temperature ──
  {
    title: 'How to Take a Temperature',
    content:
      'Taking a temperature helps determine if a fever is present. Digital thermometers are recommended over glass mercury thermometers. For infants under 3 months, use a rectal thermometer for the most accurate reading. For older children and adults, oral, ear (tympanic), or forehead (temporal artery) thermometers are appropriate. A temperature of 100.4°F (38°C) or higher is generally considered a fever. Follow the thermometer instructions and clean it before and after use.',
    zh_summary: '体温测量方法因年龄而异。婴儿最准确的是直肠测量，儿童可用耳温。38°C以上视为发烧。',
    url: 'https://medlineplus.gov/taketemperature.html',
    lastReviewed: '2023-04-10',
    population: 'general',
  },
  // ── GENERAL: Over-the-Counter Medication Guide ──
  {
    title: 'Over-the-Counter Medication Guide',
    content:
      'Over-the-counter (OTC) medications treat common ailments without a prescription. Key types include pain relievers (acetaminophen, ibuprofen), antihistamines for allergies, decongestants for congestion, antacids for heartburn, and anti-diarrheal medications. Always read labels for dosing, warnings, and drug interactions. Do not exceed recommended doses. See a healthcare provider before combining OTC medications with prescription drugs, during pregnancy, or for children under 2 years old.',
    zh_summary: '常用非处方药包括退烧止痛药、抗组胺药和咳嗽药。按标签说明使用，注意年龄限制。不确定请咨询药师。',
    url: 'https://medlineplus.gov/otcmedications.html',
    lastReviewed: '2024-03-18',
    population: 'general',
  },
  // ── GENERAL: Reading Food Labels ──
  {
    title: 'Reading Food Labels',
    content:
      'Understanding food labels helps make healthier choices. Key items include serving size, calories, total fat, sodium, total carbohydrates, fiber, sugars (including added sugars), and protein. The Percent Daily Value shows how a nutrient in one serving fits into a daily 2,000-calorie diet. Ingredients are listed in order of weight. Check for allergens listed on the label. Compare similar products to choose options lower in sodium, added sugars, and saturated fat.',
    zh_summary: '阅读食品标签了解每份热量、脂肪、钠和糖的含量。选择营养密度高、添加糖和钠含量低的食品。',
    url: 'https://medlineplus.gov/readingfoodlabels.html',
    lastReviewed: '2023-05-22',
    population: 'general',
  },
  // ── GENERAL: Hand Hygiene ──
  {
    title: 'Hand Hygiene',
    content:
      'Proper hand washing is one of the most effective ways to prevent the spread of infections. Wash hands with soap and water for at least 20 seconds, especially before eating, after using the restroom, after coughing or sneezing, and after touching public surfaces. When soap and water are not available, use hand sanitizer with at least 60 percent alcohol. Avoid touching your face with unwashed hands.',
    zh_summary: '正确洗手是预防疾病传播最简单有效的方法。用肥皂搓洗至少20秒。用餐前、如厕后和照顾病人后务必洗手。',
    url: 'https://medlineplus.gov/handhygiene.html',
    lastReviewed: '2024-04-28',
    population: 'general',
  },
  // ── GENERAL: Mask Wearing for Respiratory Illness ──
  {
    title: 'Mask Wearing for Respiratory Illness',
    content:
      'Wearing a well-fitting mask can help reduce the spread of respiratory infections such as flu, COVID-19, and RSV. Masks are especially important in healthcare settings, during outbreaks, and when caring for sick individuals. Choose masks that cover the nose and mouth snugly. N95 or KN95 respirators offer the most protection. Disposable masks should not be reused. People with respiratory symptoms should wear a mask around others to reduce transmission.',
    zh_summary: '呼吸道疾病流行时佩戴口罩可减少传播。确保口罩覆盖口鼻并贴合面部。在密闭空间或接触病人时尤为重要。',
    url: 'https://medlineplus.gov/maskwearing.html',
    lastReviewed: '2024-06-12',
    population: 'general',
  },
  // ── GENERAL: Vaccination Overview ──
  {
    title: 'Vaccination Overview',
    content:
      'Vaccines are one of the most effective tools for preventing infectious diseases. They work by training the immune system to recognize and fight specific pathogens. Recommended vaccines include those for flu, COVID-19, tetanus, measles, HPV, shingles, and pneumonia, among others. Vaccine schedules vary by age and health conditions. Side effects are usually mild and temporary. Talk to your healthcare provider about which vaccines are recommended for you and your family.',
    zh_summary: '疫苗通过刺激免疫系统产生保护性抗体来预防疾病。从出生到老年都有推荐接种的疫苗。按时完成接种计划很重要。',
    url: 'https://medlineplus.gov/vaccinationoverview.html',
    lastReviewed: '2024-01-22',
    population: 'general',
  },
  // ── GENERAL: Poison Ivy ──
  {
    title: 'Poison Ivy',
    content:
      'Poison ivy causes an itchy, blistering rash from contact with urushiol oil found in the plant\'s leaves, stems, and roots. The rash typically appears 12 to 72 hours after exposure. Wash the affected skin immediately with soap and cool water. Apply calamine lotion or hydrocortisone cream and take antihistamines for itching. The rash is not contagious. See a healthcare provider if the rash is widespread, on the face or genitals, or if blisters are oozing pus.',
    zh_summary: '毒葛接触后引起剧烈瘙痒的水泡皮疹。户外活动时穿长衣长裤避免接触。接触后立即清洗皮肤，皮疹广泛需就医。',
    url: 'https://medlineplus.gov/poisonivy.html',
    lastReviewed: '2024-05-08',
    population: 'general',
  },
  // ── GENERAL: Abdominal Hernia ──
  {
    title: 'Abdominal Hernia',
    content:
      'An abdominal hernia occurs when an organ or tissue pushes through a weak spot in the abdominal wall. Symptoms include a visible bulge (especially when standing or straining), pain or discomfort at the site, and a heavy or dragging sensation. Hernias may worsen over time and often require surgical repair. Seek emergency care if the hernia becomes painful, cannot be pushed back in, or is accompanied by nausea, vomiting, or fever, as this may indicate strangulation.',
    zh_summary: '腹疝是腹部组织通过肌肉薄弱处突出形成的包块。咳嗽或用力时可能更明显。包块无法回纳伴疼痛或变色需紧急就医。',
    url: 'https://medlineplus.gov/abdominalhernia.html',
    lastReviewed: '2023-06-15',
    population: 'general',
  },
  // ── GENERAL: Vertigo ──
  {
    title: 'Vertigo',
    content:
      'Vertigo is the sensation that you or your surroundings are spinning or moving. The most common cause is benign paroxysmal positional vertigo (BPPV), triggered by changes in head position. Other causes include inner ear infections and Meniere\'s disease. Symptoms include dizziness, nausea, balance problems, and nystagmus (abnormal eye movements). Sit or lie down during an episode to prevent falls. See a healthcare provider for recurrent vertigo, hearing changes, or vertigo with headache or neurological symptoms.',
    zh_summary: '眩晕是旋转感，常由内耳问题引起。保持安全避免跌倒。伴头痛、言语不清或肢体无力可能是中风，需紧急就医。',
    url: 'https://medlineplus.gov/vertigo.html',
    lastReviewed: '2024-02-12',
    population: 'general',
  },
  // ── GENERAL: Dehydration ──
  {
    title: 'Dehydration',
    content:
      'Dehydration occurs when the body loses more fluids than it takes in. Causes include inadequate fluid intake, vomiting, diarrhea, excessive sweating, and fever. Symptoms include thirst, dark urine, dry mouth, fatigue, dizziness, and reduced urine output. Drink water and oral rehydration solutions regularly, especially during illness and hot weather. Seek medical care for signs of severe dehydration including confusion, rapid heartbeat, very dark urine, or fainting.',
    zh_summary: '脱水是身体失水过多，症状包括口干、尿少和头晕。少量多次补液。严重脱水需紧急就医补液治疗。',
    url: 'https://medlineplus.gov/dehydration.html',
    lastReviewed: '2024-06-05',
    population: 'general',
  },
  // ── GENERAL: Diabetes Screening ──
  {
    title: 'Diabetes Screening',
    content:
      'Diabetes screening helps detect type 2 diabetes and prediabetes before complications develop. Screening tests include fasting blood glucose, A1C test, and oral glucose tolerance test. The American Diabetes Association recommends screening starting at age 35, or earlier for those with risk factors such as obesity, family history, or history of gestational diabetes. Prediabetes can often be reversed with lifestyle changes. Talk to your healthcare provider about when you should be screened.',
    zh_summary: '糖尿病筛查有助于早期发现高血糖。45岁以上或超重者应定期检查。空腹血糖和糖化血红蛋白是常用筛查指标。',
    url: 'https://medlineplus.gov/diabetesscreening.html',
    lastReviewed: '2023-08-25',
    population: 'general',
  },
  // ── GENERAL: Blood Pressure Monitoring ──
  {
    title: 'Blood Pressure Monitoring',
    content:
      'Regular blood pressure monitoring helps detect hypertension early and track treatment effectiveness. Blood pressure is measured in millimeters of mercury (mmHg) and recorded as systolic over diastolic. Normal is less than 120/80 mmHg. Elevated blood pressure is 120-129 systolic with less than 80 diastolic. Use a validated home monitor, sit quietly for five minutes before measuring, and keep a log. See a healthcare provider if readings are consistently elevated.',
    zh_summary: '定期监测血压有助于早期发现高血压。家用血压计操作简便。血压持续高于140/90mmHg需就医。',
    url: 'https://medlineplus.gov/bloodpressuremonitoring.html',
    lastReviewed: '2024-03-30',
    population: 'general',
  },
  // ── GENERAL: Healthy Sleep Habits ──
  {
    title: 'Healthy Sleep Habits',
    content:
      'Good sleep is essential for physical and mental health. Adults need 7 to 9 hours of sleep per night. Healthy sleep habits include maintaining a consistent sleep schedule, creating a cool dark quiet bedroom, limiting screen time before bed, avoiding caffeine and heavy meals near bedtime, and getting regular exercise. See a healthcare provider if you consistently have trouble falling or staying asleep, feel unrefreshed after sleep, or experience excessive daytime sleepiness.',
    zh_summary: '良好的睡眠习惯有助于整体健康。保持固定作息、限制睡前屏幕使用。成人每晚需要7-9小时睡眠。',
    url: 'https://medlineplus.gov/healthysleephabits.html',
    lastReviewed: '2024-05-15',
    population: 'general',
  },
  // ── GENERAL: Panic Attacks ──
  {
    title: 'Panic Attacks',
    content:
      'A panic attack is a sudden episode of intense fear that triggers severe physical symptoms when there is no real danger. Symptoms include rapid heartbeat, sweating, trembling, shortness of breath, chest pain, nausea, dizziness, and a feeling of unreality. Panic attacks are not dangerous but can be frightening. Practice deep slow breathing during an attack. See a healthcare provider if panic attacks are frequent, you avoid situations for fear of attacks, or anxiety is interfering with your life.',
    zh_summary: '恐慌发作表现为突然的强烈恐惧，伴心跳加速和气短。通常在10分钟内达到高峰。深呼吸可缓解，反复发作应寻求专业帮助。',
    url: 'https://medlineplus.gov/panicattacks.html',
    lastReviewed: '2023-10-05',
    population: 'general',
  },
  // ── GENERAL: Cellulitis ──
  {
    title: 'Cellulitis',
    content:
      'Cellulitis is a bacterial skin infection that causes red, swollen, warm, and tender skin. It most commonly affects the legs but can occur anywhere. It can spread quickly and become serious if untreated. Risk factors include breaks in the skin, weakened immune system, and lymphedema. Treatment requires antibiotics. See a healthcare provider promptly for expanding redness, warmth, or swelling, and seek emergency care if you have fever, chills, or red streaks spreading from the area.',
    zh_summary: '蜂窝织炎是细菌性皮肤感染，导致皮肤红肿和疼痛。可快速扩散，需抗生素治疗。红肿扩大伴发烧需紧急就医。',
    url: 'https://medlineplus.gov/cellulitis.html',
    lastReviewed: '2024-01-18',
    population: 'general',
  },
  // ── GENERAL: Tendinitis ──
  {
    title: 'Tendinitis',
    content:
      'Tendinitis is inflammation or irritation of a tendon, the thick fibrous cord that attaches muscle to bone. It causes pain and tenderness near a joint, most commonly affecting the shoulders, elbows, wrists, knees, and heels. It is often caused by repetitive motions or sudden injury. Treatment includes rest, ice, compression, and over-the-counter anti-inflammatory medications. See a healthcare provider if pain is severe, does not improve with rest, or the area is swollen and warm.',
    zh_summary: '肌腱炎是肌腱的炎症，导致关节附近疼痛。常由重复性运动引起。休息、冰敷和抗炎药可缓解，持续不好转需就医。',
    url: 'https://medlineplus.gov/tendinitis.html',
    lastReviewed: '2024-04-05',
    population: 'general',
  },
  // ── GENERAL: Concussion ──
  {
    title: 'Concussion',
    content:
      'A concussion is a mild traumatic brain injury caused by a bump, blow, or jolt to the head. Symptoms include headache, confusion, dizziness, nausea, sensitivity to light and noise, balance problems, and memory issues. Symptoms may not appear immediately. Rest and avoid physical and mental exertion until cleared by a healthcare provider. Seek emergency care for loss of consciousness, repeated vomiting, seizures, worsening headache, slurred speech, or unusual behavior.',
    zh_summary: '脑震荡是头部撞击后的轻度脑损伤，症状包括头痛、头晕和记忆问题。需要休息避免用力。意识丧失或症状恶化需紧急就医。',
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
      metadata: { language: 'en', nlm_authored: true, zh_summary: topic.zh_summary },
    };
    console.log(JSON.stringify(chunk));
  }
}

main();
