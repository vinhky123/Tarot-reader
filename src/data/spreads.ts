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
      { label: 'Hiện tại', hint: 'Trung tâm tình huống — năng lượng chính đang bao quanh người xem ngay lúc này.' },
      { label: 'Thử thách', hint: 'Giao cắt — điều che phủ hoặc chặn đường; trở ngại hoặc bài học cần đối mặt.' },
      { label: 'Nền tảng', hint: 'Gốc rễ dưới chân hiện tại — động lực vô thức hoặc nền móng đã được đặt từ lâu.' },
      { label: 'Quá khứ', hint: 'Ảnh hưởng đã qua còn sót lại — sự kiện hoặc năng lượng đã định hình hiện tại.' },
      { label: 'Mục tiêu / cao nhất', hint: 'Ý thức muốn hướng tới — điều người xem đặt làm ưu tiên hoặc lý tưởng.' },
      { label: 'Tương lai gần', hint: 'Bước tiếp theo đang lộ diện — xu hướng ngắn hạn nếu mọi thứ tiếp diễn.' },
      { label: 'Bạn', hint: 'Thái độ và vai trò của người xem — cách họ đang xuất hiện trong tình huống này.' },
      { label: 'Môi trường', hint: 'Người khác, bối cảnh bên ngoài — tác động từ gia đình, bạn bè, xã hội.' },
      { label: 'Hy vọng & nỗi sợ', hint: 'Động lực và điểm mù cảm xúc — hai mặt của cùng một năng lượng: điều khao khát và điều âm thầm lo ngại.' },
      { label: 'Kết cục', hint: 'Hướng giải quyết cuối cùng nếu giữ quỹ đạo — không phải số phận, mà là quỹ đạo hiện tại.' },
    ],
  },
  {
    id: 'horseshoe',
    title: 'Móng ngựa — Bảy lá',
    shortTitle: '7 lá',
    description:
      'Dòng chảy rộng: quá khứ, hiện tại, tương lai, ảnh hưởng ẩn, lời khuyên, tác động bên ngoài, kết quả.',
    cardCount: 7,
    positions: [
      { label: 'Quá khứ', hint: 'Nền tảng đã qua — điều đã dẫn tới tình huống hiện tại.' },
      { label: 'Hiện tại', hint: 'Trung tâm trải nghiệm lúc này.' },
      { label: 'Tương lai', hint: 'Hướng đang hình thành nếu tiếp tục quỹ đạo hiện tại.' },
      { label: 'Ảnh hưởng ẩn', hint: 'Yếu tố tiềm thức hoặc vô hình đang tác động mà người xem chưa nhận ra.' },
      { label: 'Lời khuyên', hint: 'Hướng đi được gợi ý — hành động hoặc thay đổi thái độ cụ thể.' },
      { label: 'Tác động bên ngoài', hint: 'Người khác, môi trường, bối cảnh bên ngoài đang ảnh hưởng.' },
      { label: 'Kết quả', hint: 'Điểm đến khả dĩ nếu làm theo lời khuyên — không cố định, phụ thuộc lựa chọn.' },
    ],
  },
  {
    id: 'relationship',
    title: 'Mối quan hệ — Năm lá',
    shortTitle: 'Quan hệ',
    description:
      'Đọc cho hai người: bạn, đối phương, sự kết nối, điểm mạnh, thử thách.',
    cardCount: 5,
    positions: [
      { label: 'Bạn', hint: 'Vai trò, năng lượng, thái độ của người xem trong mối quan hệ này.' },
      { label: 'Đối phương', hint: 'Vai trò, năng lượng, thái độ của người kia — cách họ đang xuất hiện.' },
      { label: 'Sự kết nối', hint: 'Bản chất mối liên kết giữa hai người — điều kéo hai bên lại hoặc đẩy ra.' },
      { label: 'Điểm mạnh', hint: 'Nền tảng vững chắc hoặc tài sản chung của mối quan hệ.' },
      { label: 'Thử thách', hint: 'Điểm căng thẳng hoặc bài học cần đối mặt cùng nhau.' },
    ],
  },
  {
    id: 'career',
    title: 'Đường nghề — Năm lá',
    shortTitle: 'Nghề nghiệp',
    description:
      'Định hướng công việc: tình huống hiện tại, thử thách, cơ hội, hành động, kết quả.',
    cardCount: 5,
    positions: [
      { label: 'Tình huống hiện tại', hint: 'Nơi đứng trong sự nghiệp hoặc công việc lúc này.' },
      { label: 'Thử thách', hint: 'Trở ngại chính hoặc điểm mắc kẹt cần vượt qua.' },
      { label: 'Cơ hội', hint: 'Lối mở hoặc tiềm năng đang hiện ra — có thể chưa nhìn thấy.' },
      { label: 'Hành động', hint: 'Bước đi cụ thể được gợi ý — nên làm gì tiếp theo.' },
      { label: 'Kết quả', hint: 'Hướng đi nếu thực hiện hành động — kết quả nghề nghiệp khả dĩ.' },
    ],
  },
]

export function getSpreadById(id: string): SpreadDefinition | undefined {
  return SPREADS.find((s) => s.id === id)
}
