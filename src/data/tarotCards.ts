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
