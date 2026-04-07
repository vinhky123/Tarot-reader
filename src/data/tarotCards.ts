import type { Suit, TarotCard } from '../types'

const DOMAIN: Record<Suit, string> = {
  wands: 'ý chí, sáng tạo và hành động',
  cups: 'cảm xúc, quan hệ và trực giác',
  swords: 'tư duy, sự thật và căng thẳng tinh thần',
  pentacles: 'vật chất, công việc, tiền bạc và thể chất',
}

const RANK_LABELS = [
  '',
  'Ace',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Page',
  'Knight',
  'Queen',
  'King',
] as const

const RANK_PHRASES: Record<
  number,
  { up: string; rev: string; kw: string[] }
> = {
  1: {
    up: 'Khởi đầu tinh khiết trong {domain}; lời mời nắm lấy cơ hội mới.',
    rev: 'Khởi đầu bị trì hoãn, năng lượng tắc hoặc lãng phí.',
    kw: ['tiềm năng', 'hạt giống'],
  },
  2: {
    up: 'Cân bằng, hợp tác hoặc lựa chọn trong {domain}.',
    rev: 'Mất cân bằng, trì hoãn quyết định hoặc căng thẳng đôi bên.',
    kw: ['đối thoại', 'cân nhắc'],
  },
  3: {
    up: 'Mở rộng, cộng đồng nhỏ hoặc bước đầu kết nối trong {domain}.',
    rev: 'Cô lập, hiểu lầm nhóm hoặc kế hoạch chưa đồng thuận.',
    kw: ['kết nối', 'mở rộng'],
  },
  4: {
    up: 'Ổn định, cấu trúc, nền móng trong {domain}.',
    rev: 'Bảo thủ cứng nhắc, tắc nghẽn hoặc sợ thay đổi.',
    kw: ['nền tảng', 'an toàn'],
  },
  5: {
    up: 'Xung đột, cạnh tranh hoặc thử thách trong {domain}.',
    rev: 'Tránh né, nội chiến hoặc xung đột chưa được giải quyết.',
    kw: ['căng thẳng', 'thử thách'],
  },
  6: {
    up: 'Tiến bộ sau thử thách; hành trình hoặc chiến thắng nhỏ trong {domain}.',
    rev: 'Kiệt sức, tự cao hoặc thiếu hướng sau sóng gió.',
    kw: ['vượt qua', 'tiến triển'],
  },
  7: {
    up: 'Kiên nhẫn, chiến lược dài hạn, chờ thời điểm trong {domain}.',
    rev: 'Thiếu kiên nhẫn, nghi ngờ hoặc phòng thủ quá mức.',
    kw: ['chờ đợi', 'chiến lược'],
  },
  8: {
    up: 'Chuyển động, can đảm đối mặt; thay đổi nhịp trong {domain}.',
    rev: 'Mắc kẹt, tự giam cầm hoặc sợ bước tiếp.',
    kw: ['dũng cảm', 'chuyển dịch'],
  },
  9: {
    up: 'Gần đích, tự tin giữ ranh giới; sức mạnh nội tại trong {domain}.',
    rev: 'Kiệt quệ, bi quan hoặc ranh giới bị xâm phạm.',
    kw: ['kiên cường', 'gần hoàn thành'],
  },
  10: {
    up: 'Đỉnh điểm chu kỳ; kết quả rõ ràng trong {domain}.',
    rev: 'Gánh nặng, kết thúc kiệt sức hoặc sợ buông bỏ.',
    kw: ['hoàn tất', 'gánh nặng'],
  },
  11: {
    up: 'Tin tức, học hỏi, sự tò mò chân thành trong {domain}.',
    rev: 'Tin đồn, trì hoãn hoặc thiếu trưởng thành.',
    kw: ['học hỏi', 'tin tức'],
  },
  12: {
    up: 'Hành động dứt khoát, đam mê, đột phá trong {domain}.',
    rev: 'Nóng vội, bốc đồng hoặc thiếu định hướng.',
    kw: ['hành động', 'đam mê'],
  },
  13: {
    up: 'Nuôi dưỡng, trực giác sâu, sự điềm tĩnh có uy trong {domain}.',
    rev: 'Phụ thuộc, thiên kiến hoặc tự ti.',
    kw: ['trực giác', 'nuôi dưỡng'],
  },
  14: {
    up: 'Uy quyền lành, kiểm soát lành mạnh, thành tựu trong {domain}.',
    rev: 'Độc đoán, cứng nhắc hoặc lạm quyền.',
    kw: ['lãnh đạo', 'ổn định'],
  },
}

const COURT_OVERRIDES: Record<string, { up: string; rev: string; kw: string[] }> = {
  // ─── Wands ────────────────────────────────────────
  'wands-11': {
    up: 'Người trẻ đầy nhiệt huyết, háo hức khám phá; mang tin vui hoặc cơ hội sáng tạo mới.',
    rev: 'Hời hợt, thiếu kiên nhẫn theo đuổi; khởi đầu nhiều nhưng bỏ dở.',
    kw: ['nhiệt huyết', 'khám phá', 'tin tức sáng tạo'],
  },
  'wands-12': {
    up: 'Dấn thân mãnh liệt, dám làm dám chịu; năng lượng bốc lửa hướng tới mục tiêu.',
    rev: 'Bốc đồng, gây xung đột vì nóng vội; thiếu kế hoạch dài hạn.',
    kw: ['dấn thân', 'bốc lửa', 'phiêu lưu'],
  },
  'wands-13': {
    up: 'Tự tin, truyền cảm hứng, thu hút người khác bằng tầm nhìn và sự ấm áp.',
    rev: 'Kiểm soát, ghen tuông, hoặc đặt kỳ vọng quá cao lên người xung quanh.',
    kw: ['tự tin', 'truyền cảm hứng', 'tầm nhìn'],
  },
  'wands-14': {
    up: 'Lãnh đạo bằng tầm nhìn lớn, quyết đoán và truyền lửa; biến ý tưởng thành hiện thực.',
    rev: 'Áp đặt, nóng tính, hoặc kiệt sức vì ôm quá nhiều trách nhiệm.',
    kw: ['lãnh đạo', 'quyết đoán', 'tầm nhìn lớn'],
  },

  // ─── Cups ─────────────────────────────────────────
  'cups-11': {
    up: 'Tâm hồn mơ mộng, trực giác nhạy bén; một lời mời lắng nghe cảm xúc và sáng tạo.',
    rev: 'Nhạy cảm quá mức, dễ bị tổn thương, hoặc ảo tưởng tình cảm.',
    kw: ['mơ mộng', 'nhạy cảm', 'trực giác'],
  },
  'cups-12': {
    up: 'Lãng mạn, theo đuổi cảm hứng; đem yêu thương vào hành động, cử chỉ chân thành.',
    rev: 'Đa tình, thất thường, hoặc đắm chìm trong ảo tưởng lãng mạn.',
    kw: ['lãng mạn', 'chân thành', 'theo đuổi'],
  },
  'cups-13': {
    up: 'Đồng cảm sâu sắc, chữa lành bằng sự hiện diện; trực giác dẫn lối quan hệ.',
    rev: 'Hy sinh bản thân quá nhiều, phụ thuộc cảm xúc, hoặc thao túng bằng lòng thương.',
    kw: ['đồng cảm', 'chữa lành', 'trực giác sâu'],
  },
  'cups-14': {
    up: 'Trưởng thành cảm xúc, bao dung, khôn ngoan trong quan hệ; cố vấn tâm linh.',
    rev: 'Thao túng tình cảm, lạnh lùng bề ngoài, hoặc dùng cảm xúc để kiểm soát.',
    kw: ['bao dung', 'khôn ngoan', 'trưởng thành cảm xúc'],
  },

  // ─── Swords ───────────────────────────────────────
  'swords-11': {
    up: 'Tò mò trí tuệ, quan sát sắc bén; sẵn sàng đào sâu sự thật dù khó chịu.',
    rev: 'Soi mói, dùng lời nói gây tổn thương, hoặc nghe ngóng thiếu mục đích.',
    kw: ['sắc bén', 'tò mò', 'sự thật'],
  },
  'swords-12': {
    up: 'Hành động nhanh, tư duy sắc sảo; lao vào vấn đề và xử lý trực diện.',
    rev: 'Hấp tấp, giao tiếp thiếu cân nhắc, hoặc gây xung đột không cần thiết.',
    kw: ['nhanh nhạy', 'trực diện', 'sắc sảo'],
  },
  'swords-13': {
    up: 'Minh mẫn, độc lập tư duy; nhìn thấu bản chất vấn đề và nói thẳng.',
    rev: 'Lạnh lùng, cắt đứt quan hệ quá dễ, hoặc dùng sự thật như vũ khí.',
    kw: ['minh mẫn', 'độc lập', 'sắc bén'],
  },
  'swords-14': {
    up: 'Phán đoán công minh, trí tuệ và kỷ luật; đưa ra quyết định khó nhưng cần thiết.',
    rev: 'Nghiêm khắc quá mức, thiếu lòng trắc ẩn, hoặc lạm dụng quyền lực trí tuệ.',
    kw: ['công minh', 'kỷ luật', 'phán đoán'],
  },

  // ─── Pentacles ────────────────────────────────────
  'pentacles-11': {
    up: 'Chăm chỉ học hỏi, xây nền từng bước; cơ hội tài chính hoặc kỹ năng mới.',
    rev: 'Thiếu tập trung, lười biếng, hoặc hoang phí tài nguyên; bỏ lỡ cơ hội thực tế.',
    kw: ['học hỏi', 'nền tảng', 'cơ hội thực tế'],
  },
  'pentacles-12': {
    up: 'Kiên trì, đáng tin cậy, làm việc có phương pháp; tiến bộ chậm nhưng chắc.',
    rev: 'Trì trệ, thiếu động lực, hoặc kiên trì sai hướng; cần đánh giá lại lộ trình.',
    kw: ['kiên trì', 'đáng tin', 'phương pháp'],
  },
  'pentacles-13': {
    up: 'Thực tế và hào phóng, tạo không gian an toàn; giỏi nuôi dưỡng sự ổn định.',
    rev: 'Bất an tài chính, bám víu vật chất, hoặc quá lo lắng về tiền bạc.',
    kw: ['hào phóng', 'ổn định', 'thực tế'],
  },
  'pentacles-14': {
    up: 'Thành đạt, kỷ luật tài chính, biết xây dựng và bảo vệ di sản lâu dài.',
    rev: 'Tham lam, coi trọng vật chất hơn người, hoặc keo kiệt đến mức tự cô lập.',
    kw: ['thành đạt', 'kỷ luật', 'di sản'],
  },
}

function expand(s: string, suit: Suit): string {
  return s.replace('{domain}', DOMAIN[suit])
}

function buildMinors(): TarotCard[] {
  const suits: Suit[] = ['wands', 'cups', 'swords', 'pentacles']
  const out: TarotCard[] = []
  let id = 22
  for (const suit of suits) {
    const suitCap = suit.charAt(0).toUpperCase() + suit.slice(1)
    for (let rank = 1; rank <= 14; rank++) {
      const courtKey = `${suit}-${rank}`
      const court = COURT_OVERRIDES[courtKey]
      if (court) {
        out.push({
          id,
          name: `${RANK_LABELS[rank]} of ${suitCap}`,
          arcana: 'minor',
          suit,
          upright: court.up,
          reversed: court.rev,
          keywords: court.kw,
        })
      } else {
        const phrase = RANK_PHRASES[rank]
        out.push({
          id,
          name: `${RANK_LABELS[rank]} of ${suitCap}`,
          arcana: 'minor',
          suit,
          upright: expand(phrase.up, suit),
          reversed: expand(phrase.rev, suit),
          keywords: [...phrase.kw, DOMAIN[suit].split(',')[0].trim()],
        })
      }
      id += 1
    }
  }
  return out
}

const MAJOR_DEFS: Omit<TarotCard, 'id' | 'arcana'>[] = [
  {
    name: 'The Fool',
    upright:
      'Khởi đầu mới, ngây thơ trong lành, tin vào hành trình; tự do tinh thần.',
    reversed:
      'Liều lĩnh thiếu suy nghĩ, bị cuốn theo người khác, trốn tránh trách nhiệm.',
    keywords: ['mới mẻ', 'tự do', 'bước nhảy'],
  },
  {
    name: 'The Magician',
    upright:
      'Ý chí hướng đích, khả năng biến ý tưởng thành hiện thực; tập trung và kỹ năng.',
    reversed:
      'Lừa dối, lãng phí tài năng, thao túng hoặc thiếu hành động có chủ đích.',
    keywords: ['sáng tạo', 'ý chí', 'kỹ năng'],
  },
  {
    name: 'The High Priestess',
    upright:
      'Trực giác sâu, tri thức ẩn, lắng nghe nội tâm; nhịp chậm và bí ẩn.',
    reversed:
      'Bí mật độc hại, bỏ quên trực giác, căng thẳng tiềm ẩn chưa được nhìn.',
    keywords: ['trực giác', 'bí ẩn', 'nội tâm'],
  },
  {
    name: 'The Empress',
    upright:
      'Dồi dào, nuôi dưỡng, sáng tạo sinh sôi; đất mẹ, tình yêu và sự ấm áp.',
    reversed:
      'Phụ thuộc, kiệt sức vì chăm sóc, sáng tạo bị kìm hoặc tự ti về thân thể.',
    keywords: ['dồi dào', 'nuôi dưỡng', 'sinh sôi'],
  },
  {
    name: 'The Emperor',
    upright:
      'Kỷ luật, cấu trúc, trật tự; trách nhiệm và ranh giới lành mạnh.',
    reversed:
      'Độc đoán, kiểm soát cứng nhắc, bất an về quyền lực hoặc thiếu cấu trúc.',
    keywords: ['kỷ luật', 'trật tự', 'ranh giới'],
  },
  {
    name: 'The Hierophant',
    upright:
      'Truyền thống, học hỏi từ đàn anh, giá trị chung; nghi lễ và hướng dẫn.',
    reversed:
      'Phá vỡ khuôn mẫu cũ, mâu thuẫn với quy tắc, hoặc giáo điều cứng nhắc.',
    keywords: ['truyền thống', 'học hỏi', 'hướng dẫn'],
  },
  {
    name: 'The Lovers',
    upright:
      'Lựa chọn có trái tim; hài hòa, cam kết, sự gắn kết chân thành.',
    reversed:
      'Mâu thuẫn giá trị, lựa chọn mơ hồ, phụ thuộc hoặc mất kết nối.',
    keywords: ['lựa chọn', 'gắn kết', 'hài hòa'],
  },
  {
    name: 'The Chariot',
    upright:
      'Tiến lên có mục tiêu, chiến thắng qua ý chí; kiểm soát hướng đi.',
    reversed:
      'Mất phương hướng, hung hăng vô ích, xung đột nội tâm kéo chân.',
    keywords: ['tiến bước', 'ý chí', 'chiến thắng'],
  },
  {
    name: 'Strength',
    upright:
      'Dịu dàng kiên định, can đảm nội tại; chế ngự bằng lòng trắc ẩn.',
    reversed:
      'Nghi ngờ bản thân, cáu kỉnh hoặc dùng sức mạnh sai cách.',
    keywords: ['can đảm', 'kiên nhẫn', 'nội lực'],
  },
  {
    name: 'The Hermit',
    upright:
      'Soi sáng bên trong, tìm câu trả lời một mình; khôn ngoan từ kinh nghiệm.',
    reversed:
      'Cô lập quá mức, trốn tránh người khác hoặc từ chối lời khuyên hữu ích.',
    keywords: ['nội quan', 'khôn ngoan', 'tĩnh lặng'],
  },
  {
    name: 'Wheel of Fortune',
    upright:
      'Chu kỳ đổi thay, vận may, bước ngoặt; chấp nhận nhịp số phận.',
    reversed:
      'Kháng cự thay đổi, cảm giác bị kẹt, vận xui tạm thời.',
    keywords: ['chu kỳ', 'thay đổi', 'vận may'],
  },
  {
    name: 'Justice',
    upright:
      'Công bằng, sự thật, trách nhiệm; quả báo cân bằng.',
    reversed:
      'Thiên vị, trì hoãn phán quyết, né tránh trách nhiệm hoặc tự lừa dối.',
    keywords: ['công bằng', 'sự thật', 'trách nhiệm'],
  },
  {
    name: 'The Hanged Man',
    upright:
      'Buông để thấy khác; góc nhìn mới, hy sinh có chủ đích, tạm dừng.',
    reversed:
      'Bế tắc, hy sinh vô ích, chống đổi thay đổi hoặc martyr phức tạp.',
    keywords: ['buông bỏ', 'góc nhìn mới', 'tạm dừng'],
  },
  {
    name: 'Death',
    upright:
      'Kết thúc một giai đoạn, chuyển hóa sâu; nhường chỗ cho điều mới.',
    reversed:
      'Bám víu quá khứ, sợ buông, thay đổi bị trì hoãn.',
    keywords: ['chuyển hóa', 'kết thúc', 'tái sinh'],
  },
  {
    name: 'Temperance',
    upright:
      'Cân bằng, hòa trộn, tiết chế; đi giữa hai thái cực một cách khôn ngoan.',
    reversed:
      'Thái quá, mất cân bằng, tìm kích thích để lấp chỗ trống.',
    keywords: ['cân bằng', 'hòa hợp', 'tiết chế'],
  },
  {
    name: 'The Devil',
    upright:
      'Ràng buộc, thói quen, bóng tối cám dỗ; nhận ra xiềng xích tự nguyện.',
    reversed:
      'Giải phóng khỏi phụ thuộc, đối mặt sợ hãi, phá vỡ vòng lặp.',
    keywords: ['ràng buộc', 'thói quen', 'bóng tối'],
  },
  {
    name: 'The Tower',
    upright:
      'Đột phá, sự thật chấn động, sụp đổ ảo tưởng; giải phóng khẩn cấp.',
    reversed:
      'Trì hoãn điều không thể tránh, nỗi sợ thay đổi, sóng ngầm chưa nổ.',
    keywords: ['đột biến', 'sự thật', 'giải phóng'],
  },
  {
    name: 'The Star',
    upright:
      'Hy vọng dịu, chữa lành, được dẫn đường; tin tưởng sau bão tố.',
    reversed:
      'Mất niềm tin, hoài nghi, cảm giác trống rỗng tinh thần.',
    keywords: ['hy vọng', 'chữa lành', 'tinh tú'],
  },
  {
    name: 'The Moon',
    upright:
      'Ảo ảnh, tiềm thức, sợ hãi mơ hồ; cần lắng nghe giấc mơ và trực giác.',
    reversed:
      'Sự thật dần lộ, giảm lo âu, hoặc tự lừa dối sắp tan.',
    keywords: ['ảo ảnh', 'tiềm thức', 'giấc mơ'],
  },
  {
    name: 'The Sun',
    upright:
      'Rạng rỡ, thành công rõ ràng, niềm vui chân thật; sống động và minh bạch.',
    reversed:
      'Quá chói chang, kiêu ngạo nhỏ, hoặc niềm vui tạm che vấn đề.',
    keywords: ['niềm vui', 'thành công', 'ánh sáng'],
  },
  {
    name: 'Judgement',
    upright:
      'Gọi mời tỉnh thức, tha thứ, tái sinh; đánh giá lại đời mình.',
    reversed:
      'Tự trách hà khắc, lặp lại lỗi cũ, từ chối lời mời thay đổi.',
    keywords: ['tỉnh thức', 'tha thứ', 'tái sinh'],
  },
  {
    name: 'The World',
    upright:
      'Hoàn thành chu kỳ, hội nhập, tự do trong khung lành; cảm giác trọn vẹn.',
    reversed:
      'Chưa khép lại được, còn dang dở, hoặc sợ bước vào chu kỳ mới.',
    keywords: ['hoàn tất', 'tích hợp', 'chu kỳ'],
  },
]

const majors: TarotCard[] = MAJOR_DEFS.map((d, i) => ({
  ...d,
  id: i,
  arcana: 'major',
}))

export const TAROT_CARDS: TarotCard[] = [...majors, ...buildMinors()]

export function getCardById(id: number): TarotCard | undefined {
  return TAROT_CARDS[id]
}
