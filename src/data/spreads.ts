export interface SpreadPosition {
  label: string
  /** Gợi ý ý nghĩa vị trí cho AI */
  hint: string
}

export interface SpreadDefinition {
  id: string
  title: string
  shortTitle: string
  description: string
  cardCount: number
  positions: SpreadPosition[]
}

export const SPREADS: SpreadDefinition[] = [
  {
    id: 'one',
    title: 'Một lá — Thông điệp trong ngày',
    shortTitle: '1 lá',
    description:
      'Một lá duy nhất: tập trung vào năng lượng chính đang vây quanh bạn.',
    cardCount: 1,
    positions: [
      {
        label: 'Tâm điểm',
        hint: 'Thông điệp cốt lõi hoặc năng lượng nổi bật lúc này.',
      },
    ],
  },
  {
    id: 'three',
    title: 'Ba lá — Quá khứ · Hiện tại · Tương lai',
    shortTitle: '3 lá',
    description:
      'Dòng chảy thời gian: nền tảng đã qua, điểm đứng hiện tại, hướng mở ra phía trước.',
    cardCount: 3,
    positions: [
      { label: 'Quá khứ', hint: 'Những gì đã dẫn tới tình huống.' },
      { label: 'Hiện tại', hint: 'Trung tâm trải nghiệm đang diễn ra.' },
      { label: 'Tương lai', hint: 'Xu hướng hoặc khả năng đang hình thành.' },
    ],
  },
  {
    id: 'five',
    title: 'Năm lá — Thánh giá nhỏ',
    shortTitle: '5 lá',
    description:
      'Bức tranh cân bằng: hiện tại, thử thách, nền tảng, xu hướng và kết quả.',
    cardCount: 5,
    positions: [
      { label: 'Hiện tại', hint: 'Tình huống cốt lõi.' },
      { label: 'Thử thách', hint: 'Trở ngại hoặc bài học đang chạm tới bạn.' },
      { label: 'Nền tảng', hint: 'Gốc rễ hoặc động lực sâu hơn.' },
      { label: 'Xu hướng', hint: 'Hướng phát triển gần tới.' },
      { label: 'Kết quả', hint: 'Điểm có thể đạt được nếu giữ nhịp hiện tại.' },
    ],
  },
  {
    id: 'celtic',
    title: 'Thánh giá Celtic — Mười lá',
    shortTitle: 'Celtic Cross',
    description:
      'Trải bài đầy đủ: tình huống, chướng ngại, tiềm thức, quá khứ, mục tiêu, tương lai gần, bản thân, môi trường, hy vọng / lo sợ, kết cục.',
    cardCount: 10,
    positions: [
      { label: 'Hiện tại', hint: 'Trung tâm tình huống.' },
      { label: 'Thử thách', hint: 'Giao cắt — điều che phủ hoặc chặn đường.' },
      { label: 'Nền tảng', hint: 'Gốc rễ dưới chân hiện tại.' },
      { label: 'Quá khứ', hint: 'Ảnh hưởng đã qua còn sót lại.' },
      { label: 'Mục tiêu / cao nhất', hint: 'Ý thức muốn hướng tới.' },
      { label: 'Tương lai gần', hint: 'Bước tiếp theo đang lộ diện.' },
      { label: 'Bạn', hint: 'Thái độ và vai trò của bạn.' },
      { label: 'Môi trường', hint: 'Người khác, bối cảnh bên ngoài.' },
      { label: 'Hy vọng & nỗi sợ', hint: 'Động lực và điểm mù cảm xúc.' },
      { label: 'Kết cục', hint: 'Hướng giải quyết cuối cùng nếu giữ quỹ đạo.' },
    ],
  },
]

export function getSpreadById(id: string): SpreadDefinition | undefined {
  return SPREADS.find((s) => s.id === id)
}
