import {
  Buildings,
  Bus,
  Clock,
  Ticket,
  WarningCircle,
} from "@phosphor-icons/react";

import type { Language } from "./AppShell";
import { displayText } from "../lib/display";
import { defineTranslations } from "../lib/i18n";

const copy = defineTranslations({
  zh: {
    eyebrow: "场馆移动指南",
    heading: "在四个核心场馆区之间聪明移动",
    intro:
      "先按内容价值选主场，再把跨馆移动视为稀缺时间。下面的定位、开放边界与接驳频率，帮助你减少无效折返。",
    venueLabel: "四个核心场馆定位",
    venues: [
      {
        title: "世博中心前沿思想策源地",
        detail: "高密度论坛主场，适合追踪前沿议题与产业判断。",
      },
      {
        title: "世博展览馆全景应用展示窗",
        detail: "集中观察技术落地、产品体验与行业应用。",
      },
      {
        title: "徐汇西岸未来科技体验场",
        detail: "适合沉浸体验、城市科技与跨界创新探索。",
      },
      {
        title: "张江科学会堂智能算力芯引擎",
        detail: "聚焦算力、芯片、基础设施与硬科技生态。",
      },
    ],
    shuttleHeading: "免费接驳节奏",
    shuttleIntro: "官方接驳班次会随现场交通调整，出发前请再次确认站点信息。",
    shuttles: [
      "西岸↔张江约10分钟一班",
      "西岸↔世博展览馆约15分钟一班",
      "世博展览馆↔张江约15分钟一班",
    ],
    lastShuttle: "末班18:30",
    buffer: "路线中的换馆时间是建议缓冲，不是官方车程。",
    accessHeading: "公众开放时间",
    opening: [
      "7月17日上午不开放",
      "7月17日 13:30-17:00 仅受邀",
      "7月18-19日 9:00-17:00",
      "7月20日 9:00-16:00",
    ],
    ticketHeading: "先确认你的入场权益",
    ticketLead: "",
    ticket:
      "论坛票与展览票权益不同。论坛活动以单场报名或邀请资格为准，展览入场以对应日期门票为准。",
    verify: "最终开放安排与接驳班次以 WAIC 官网和 Hi WAIC APP 当日发布为准。",
  },
  en: {
    eyebrow: "Venue movement guide",
    heading: "Move between four core venue zones",
    intro:
      "Choose a primary venue for its content value, then treat every transfer as scarce time. Use these venue roles, access windows, and shuttle intervals to avoid low-value backtracking.",
    venueLabel: "Four core venue roles",
    venues: [
      {
        title: "Expo Center, frontier ideas hub",
        detail: "The main forum cluster for frontier topics and industry perspectives.",
      },
      {
        title: "World Expo Exhibition Center, panoramic application showcase",
        detail: "A concentrated view of deployed technology, products, and industry use cases.",
      },
      {
        title: "Xuhui West Bund, future technology experience zone",
        detail: "Best for immersive experiences, urban technology, and cross-sector innovation.",
      },
      {
        title: "Zhangjiang Science Hall, intelligent computing and chips engine",
        detail: "Focused on compute, chips, infrastructure, and hard-technology ecosystems.",
      },
    ],
    shuttleHeading: "Free shuttle rhythm",
    shuttleIntro:
      "Official intervals may change with traffic conditions. Confirm the stop before you leave.",
    shuttles: [
      "West Bund ↔ Zhangjiang about every 10 min",
      "West Bund ↔ World Expo Exhibition Center about every 15 min",
      "World Expo Exhibition Center ↔ Zhangjiang about every 15 min",
    ],
    lastShuttle: "Last shuttle 18:30",
    buffer: "Transfer time in your route is a planning buffer, not an official journey time.",
    accessHeading: "Public opening hours",
    opening: [
      "Morning of July 17 closed to the public",
      "July 17, 13:30-17:00 invited guests only",
      "July 18-19, 9:00-17:00",
      "July 20, 9:00-16:00",
    ],
    ticketHeading: "Confirm your access first",
    ticketLead: "Forum and exhibition tickets grant different access.",
    ticket:
      "Forum sessions require registration for that session or an invitation. Exhibition entry requires a ticket valid for the relevant date.",
    verify:
      "Follow the WAIC website and Hi WAIC APP for final opening and shuttle updates on the day.",
  },
  ja: {
    eyebrow: "会場移動ガイド", heading: "4つの主要会場を賢く移動", intro: "内容価値で主会場を選び、会場間の移動を貴重な時間として扱いましょう。会場の役割、公開時間、シャトル間隔を確認して無駄な往復を減らせます。", venueLabel: "4つの主要会場の特徴",
    venues: [{ title: "上海世博センター、先端思想の拠点", detail: "先端テーマと産業動向を追う高密度フォーラムの中心です。" }, { title: "上海世博展覧館、応用のショーケース", detail: "実装技術、製品体験、業界活用を集中的に確認できます。" }, { title: "徐匯西岸、未来技術体験ゾーン", detail: "没入体験、都市技術、分野横断のイノベーションに適しています。" }, { title: "張江科学会堂、計算基盤とチップの中核", detail: "計算資源、チップ、インフラ、ハードテックのエコシステムに焦点を当てます。" }],
    shuttleHeading: "無料シャトルの運行目安", shuttleIntro: "交通状況により運行間隔が変わります。出発前に乗り場を再確認してください。", shuttles: ["西岸 ↔ 張江：約10分間隔", "西岸 ↔ 世博展覧館：約15分間隔", "世博展覧館 ↔ 張江：約15分間隔"], lastShuttle: "最終便 18:30", buffer: "ルートの移動時間は推奨バッファであり、公式所要時間ではありません。", accessHeading: "一般公開時間", opening: ["7月17日午前は一般非公開", "7月17日 13:30-17:00は招待者のみ", "7月18-19日 9:00-17:00", "7月20日 9:00-16:00"], ticketHeading: "入場権限を先に確認", ticketLead: "フォーラム券と展示券では入場範囲が異なります。", ticket: "フォーラムは各回の登録または招待が必要です。展示入場には対象日付の有効なチケットが必要です。", verify: "最終的な公開時間とシャトル情報はWAIC公式サイトとHi WAIC APPで当日ご確認ください。",
  },
  ko: {
    eyebrow: "장소 이동 안내", heading: "4개 핵심 장소를 효율적으로 이동", intro: "콘텐츠 가치에 따라 주 장소를 정하고 장소 간 이동을 귀한 시간으로 보세요. 장소 역할, 공개 시간, 셔틀 간격으로 불필요한 왕복을 줄일 수 있습니다.", venueLabel: "4개 핵심 장소 특징", venues: [{ title: "상하이 엑스포 센터, 첨단 담론의 중심", detail: "첨단 주제와 산업 관점을 다루는 고밀도 포럼 중심지입니다." }, { title: "세계박람회 전시컨벤션센터, 응용 쇼케이스", detail: "상용 기술, 제품, 산업 활용 사례를 집중적으로 볼 수 있습니다." }, { title: "쉬후이 웨스트번드, 미래 기술 체험 구역", detail: "몰입형 경험, 도시 기술, 융합 혁신에 적합합니다." }, { title: "장장 과학회당, 컴퓨팅·칩 엔진", detail: "컴퓨팅, 칩, 인프라와 하드테크 생태계에 집중합니다." }], shuttleHeading: "무료 셔틀 간격", shuttleIntro: "현장 교통에 따라 간격이 달라질 수 있으니 출발 전 정류장을 확인하세요.", shuttles: ["웨스트번드 ↔ 장장 약 10분 간격", "웨스트번드 ↔ 엑스포 전시장 약 15분 간격", "엑스포 전시장 ↔ 장장 약 15분 간격"], lastShuttle: "막차 18:30", buffer: "동선의 이동 시간은 권장 여유 시간이며 공식 소요 시간이 아닙니다.", accessHeading: "일반 공개 시간", opening: ["7월 17일 오전 일반 비공개", "7월 17일 13:30-17:00 초청자만", "7월 18-19일 9:00-17:00", "7월 20일 9:00-16:00"], ticketHeading: "입장 권한 먼저 확인", ticketLead: "포럼 티켓과 전시 티켓의 입장 범위가 다릅니다.", ticket: "포럼은 개별 등록 또는 초청이 필요하며 전시는 해당 날짜의 유효한 티켓이 필요합니다.", verify: "최종 공개 시간과 셔틀 정보는 당일 WAIC 웹사이트와 Hi WAIC APP을 확인하세요.",
  },
  fr: {
    eyebrow: "Guide des déplacements", heading: "Circulez efficacement entre quatre zones principales", intro: "Choisissez votre lieu principal selon la valeur du contenu et considérez chaque transfert comme du temps rare. Ces rôles, horaires et navettes limitent les détours.", venueLabel: "Rôle des quatre lieux principaux", venues: [{ title: "Centre Expo, pôle des idées de pointe", detail: "Le principal ensemble de forums sur les thèmes de pointe et les perspectives sectorielles." }, { title: "Centre d’exposition, vitrine des applications", detail: "Technologies déployées, produits et cas d’usage sectoriels." }, { title: "West Bund, zone d’expérience des technologies futures", detail: "Expériences immersives, technologies urbaines et innovation transversale." }, { title: "Palais des sciences de Zhangjiang, moteur du calcul et des puces", detail: "Calcul, puces, infrastructures et écosystèmes deep tech." }], shuttleHeading: "Rythme des navettes gratuites", shuttleIntro: "Les intervalles peuvent changer selon la circulation. Vérifiez l’arrêt avant de partir.", shuttles: ["West Bund ↔ Zhangjiang toutes les 10 min environ", "West Bund ↔ Centre d’exposition toutes les 15 min environ", "Centre d’exposition ↔ Zhangjiang toutes les 15 min environ"], lastShuttle: "Dernière navette 18:30", buffer: "Le temps de transfert est une marge conseillée, pas un temps de trajet officiel.", accessHeading: "Horaires d’ouverture au public", opening: ["Matin du 17 juillet fermé au public", "17 juillet, 13:30-17:00 sur invitation", "18-19 juillet, 9:00-17:00", "20 juillet, 9:00-16:00"], ticketHeading: "Vérifiez d’abord votre accès", ticketLead: "Les billets forum et exposition donnent des accès différents.", ticket: "Chaque forum exige une inscription ou une invitation. L’exposition nécessite un billet valable à la date concernée.", verify: "Consultez le site WAIC et Hi WAIC APP le jour même pour les informations finales.",
  },
  de: {
    eyebrow: "Leitfaden für Ortswechsel", heading: "Effizient zwischen vier Kernbereichen wechseln", intro: "Wählen Sie den Hauptort nach Inhaltswert und behandeln Sie Transfers als knappe Zeit. Rollen, Öffnungszeiten und Shuttle-Takte helfen gegen unnötige Wege.", venueLabel: "Rollen der vier Kernorte", venues: [{ title: "Expo Center, Zentrum für Zukunftsideen", detail: "Das dichteste Forumcluster für Zukunftsthemen und Branchenperspektiven." }, { title: "Expo Exhibition Center, Schaufenster der Anwendungen", detail: "Technologieeinsatz, Produkte und industrielle Anwendungsfälle." }, { title: "West Bund, Erlebniszone für Zukunftstechnologie", detail: "Immersive Erlebnisse, urbane Technologie und branchenübergreifende Innovation." }, { title: "Zhangjiang Science Hall, Motor für Computing und Chips", detail: "Computing, Chips, Infrastruktur und Deep-Tech-Ökosysteme." }], shuttleHeading: "Takt der kostenlosen Shuttles", shuttleIntro: "Intervalle können sich durch Verkehr ändern. Prüfen Sie die Haltestelle vor der Abfahrt.", shuttles: ["West Bund ↔ Zhangjiang etwa alle 10 Min.", "West Bund ↔ Expo Exhibition Center etwa alle 15 Min.", "Expo Exhibition Center ↔ Zhangjiang etwa alle 15 Min."], lastShuttle: "Letzter Shuttle 18:30", buffer: "Transferzeiten sind Planungspuffer, keine offiziellen Fahrzeiten.", accessHeading: "Öffnungszeiten für Besucher", opening: ["17. Juli vormittags nicht öffentlich", "17. Juli, 13:30-17:00 nur auf Einladung", "18.-19. Juli, 9:00-17:00", "20. Juli, 9:00-16:00"], ticketHeading: "Zugang zuerst prüfen", ticketLead: "Forum- und Ausstellungstickets gewähren unterschiedliche Zugänge.", ticket: "Foren erfordern eine Einzelanmeldung oder Einladung. Für die Ausstellung ist ein Ticket für den jeweiligen Tag nötig.", verify: "Aktuelle Öffnungs- und Shuttle-Informationen finden Sie am Veranstaltungstag auf der WAIC-Website und in der Hi WAIC APP.",
  },
  es: {
    eyebrow: "Guía de desplazamientos", heading: "Muévete con eficiencia entre cuatro zonas principales", intro: "Elige el recinto principal por el valor de su contenido y trata cada traslado como tiempo escaso. Los roles, horarios y lanzaderas ayudan a evitar rodeos.", venueLabel: "Función de los cuatro recintos principales", venues: [{ title: "Centro Expo, núcleo de ideas de vanguardia", detail: "Principal concentración de foros sobre temas de frontera y perspectivas sectoriales." }, { title: "Centro de Exposiciones, escaparate de aplicaciones", detail: "Tecnología desplegada, productos y casos de uso industriales." }, { title: "West Bund, zona de experiencia tecnológica", detail: "Experiencias inmersivas, tecnología urbana e innovación transversal." }, { title: "Palacio de Ciencias de Zhangjiang, motor de computación y chips", detail: "Computación, chips, infraestructura y ecosistemas deep tech." }], shuttleHeading: "Frecuencia de lanzaderas gratuitas", shuttleIntro: "Los intervalos pueden cambiar con el tráfico. Confirma la parada antes de salir.", shuttles: ["West Bund ↔ Zhangjiang cada 10 min aprox.", "West Bund ↔ Centro de Exposiciones cada 15 min aprox.", "Centro de Exposiciones ↔ Zhangjiang cada 15 min aprox."], lastShuttle: "Última lanzadera 18:30", buffer: "El tiempo de traslado es un margen recomendado, no un tiempo oficial.", accessHeading: "Horario de apertura al público", opening: ["Mañana del 17 de julio cerrada al público", "17 de julio, 13:30-17:00 solo con invitación", "18-19 de julio, 9:00-17:00", "20 de julio, 9:00-16:00"], ticketHeading: "Confirma primero tu acceso", ticketLead: "Las entradas de foros y exposición ofrecen accesos distintos.", ticket: "Los foros requieren inscripción individual o invitación. La exposición requiere una entrada válida para la fecha.", verify: "Consulta el sitio de WAIC y Hi WAIC APP el mismo día para la información final.",
  },
  ar: {
    eyebrow: "دليل التنقل بين الأماكن", heading: "تنقّل بذكاء بين أربع مناطق رئيسية", intro: "اختر مكانك الرئيسي حسب قيمة المحتوى واعتبر كل انتقال وقتاً ثميناً. تساعدك أدوار الأماكن وساعات الدخول ومواعيد الحافلات على تجنب التنقل غير الضروري.", venueLabel: "أدوار الأماكن الأربعة الرئيسية", venues: [{ title: "مركز شنغهاي إكسبو، محور الأفكار المتقدمة", detail: "التجمع الرئيسي للمنتديات حول موضوعات المستقبل ورؤى الصناعة." }, { title: "مركز المعارض، نافذة التطبيقات", detail: "عرض مركز للتقنيات المطبقة والمنتجات وحالات الاستخدام." }, { title: "ويست بوند، منطقة تجربة تقنيات المستقبل", detail: "للتجارب الغامرة وتقنيات المدن والابتكار العابر للقطاعات." }, { title: "قاعة تشانغجيانغ للعلوم، محرك الحوسبة والرقائق", detail: "تركز على الحوسبة والرقائق والبنية التحتية والتقنيات العميقة." }], shuttleHeading: "وتيرة الحافلات المجانية", shuttleIntro: "قد تتغير الفواصل حسب المرور. تحقق من المحطة قبل المغادرة.", shuttles: ["ويست بوند ↔ تشانغجيانغ كل 10 دقائق تقريباً", "ويست بوند ↔ مركز المعارض كل 15 دقيقة تقريباً", "مركز المعارض ↔ تشانغجيانغ كل 15 دقيقة تقريباً"], lastShuttle: "آخر حافلة 18:30", buffer: "وقت الانتقال هامش تخطيطي مقترح وليس زمناً رسمياً للرحلة.", accessHeading: "ساعات الدخول للجمهور", opening: ["صباح 17 يوليو مغلق للجمهور", "17 يوليو، 13:30-17:00 بالدعوة فقط", "18-19 يوليو، 9:00-17:00", "20 يوليو، 9:00-16:00"], ticketHeading: "تحقق من صلاحية دخولك أولاً", ticketLead: "تذاكر المنتديات والمعرض تمنح صلاحيات مختلفة.", ticket: "تتطلب جلسات المنتدى تسجيلاً منفصلاً أو دعوة، ويتطلب المعرض تذكرة صالحة للتاريخ المحدد.", verify: "راجع موقع WAIC وتطبيق Hi WAIC يوم الفعالية للمواعيد النهائية.",
  },
});

export function VenueGuide({ language }: { language: Language }) {
  const content = copy[language];

  return (
    <section
      className="page-section venue-guide"
      id="venues"
      aria-labelledby="venue-guide-title"
    >
      <header className="section-heading venue-guide-heading">
        <p className="venue-guide-eyebrow">
          <Buildings aria-hidden="true" weight="duotone" />
          {displayText(content.eyebrow)}
        </p>
        <h2 id="venue-guide-title">{displayText(content.heading)}</h2>
        <p>{displayText(content.intro)}</p>
      </header>

      <div className="venue-guide-layout">
        <aside className="venue-index" aria-hidden="true">
          <span>04</span>
          <small>{displayText(content.venueLabel)}</small>
        </aside>
        <ol className="venue-position-list" aria-label={displayText(content.venueLabel)}>
          {content.venues.map((venue, index) => (
            <li key={venue.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <strong>{displayText(venue.title)}</strong>
                <p>{displayText(venue.detail)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="venue-logistics-grid">
        <article className="shuttle-panel">
          <header>
            <Bus aria-hidden="true" weight="duotone" />
            <div>
              <h3>{displayText(content.shuttleHeading)}</h3>
              <p>{displayText(content.shuttleIntro)}</p>
            </div>
          </header>
          <div className="shuttle-axis">
            {content.shuttles.map((shuttle, index) => (
              <div className="shuttle-leg" key={shuttle}>
                <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                <strong>{displayText(shuttle)}</strong>
              </div>
            ))}
          </div>
          <div className="shuttle-last">
            <Clock aria-hidden="true" weight="bold" />
            <strong>{displayText(content.lastShuttle)}</strong>
          </div>
          <p className="venue-buffer-note">
            <WarningCircle aria-hidden="true" weight="fill" />
            {displayText(content.buffer)}
          </p>
        </article>

        <div className="venue-access-stack">
          <article className="access-panel">
            <h3>{displayText(content.accessHeading)}</h3>
            <ul>
              {content.opening.map((window) => (
                <li key={window}>{displayText(window)}</li>
              ))}
            </ul>
          </article>
          <article className="ticket-panel">
            <Ticket aria-hidden="true" weight="duotone" />
            <div>
              <h3>{displayText(content.ticketHeading)}</h3>
              {content.ticketLead ? (
                <>
                  <strong>{displayText(content.ticketLead)}</strong>
                  <p>{displayText(content.ticket)}</p>
                </>
              ) : <p>{displayText(content.ticket)}</p>}
              <small>{displayText(content.verify)}</small>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
