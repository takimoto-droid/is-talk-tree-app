import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { EmailGenerateInput, EmailGenerateOutput, CustomEmailInput } from '@/types';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CASE_STUDIES = `| 業界 | 企業名 | 概要 |
|------|--------|------|
| 建設・ハウスメーカー | 大和ハウス工業様 | 全国のエリア経営者向けに財務/非財務/市場情報を統合した「経営支援ダッシュボード」を構築し、支店経営判断のリアルタイム化を実現 |
| 不動産 | 野村不動産様 | 部門横断で同じ指標を共有し、データに基づく意思決定文化を醸成 |
| 不動産・建設 | オープンハウス様 | ROA/ROEなど複数の経営KPIをダッシュボード化し、導入数週間で稼働開始 |
| エネルギー・インフラ | コスモエネルギーHD様 | 「可視化を起点」にPoCから1ヶ月で実装。グループ7,000人への全社展開でデータアンバサダー育成まで実現 |
| 通信・大企業全社展開 | KDDI様 | 経営層へのリアルタイム経営情報提供を実現。物流統括部でも採算管理の工数・コスト削減を達成 |
| BPO・IT | ユニアデックス様 | 部門横断タスクフォースで全社活用推進。最大90%の業務削減効果を実現 |
| 製造・住設 | ノーリツ様 | 全国500名の営業部門でExcel文化をDOMOに完全移行。レポート作成がボタン一つになり残業時間を削減 |
| 物流 | 大和物流様 | 全社データ活用で競争力を強化。大和ハウスグループでの横展開事例 |`;

const COMMON_RULES = `【生成時の絶対禁止事項】
- 「推進されています」は使わない
- 「提案させていただきたく」は使わない
- WhyYouの③で「お役に立てるかと」「ご支援できればと」などの弱い表現は使わない → 断言で締める
- 「何を見たか」に「貴社のWebサイトを拝見し」等の抽象表現は使わない → 必ず具体的な情報源・施策・数字を使う
- 本文のWhyYou部分は250字前後を目安に。冗長にしない
- 事例のURL行は本文には挿入しない（事例名と概要のみ記載）
- 出力はJSON形式のみ（説明文不要）: {"subject": "件名", "body": "本文"}`;

function buildSignature(input: { senderName?: string; senderCompany?: string; senderEmail?: string; senderPhone?: string }): string {
  const name = input.senderName || 'Hikari Michimoto / 道本 光';
  const company = input.senderCompany || 'Domo, Inc.';
  const email = input.senderEmail || 'hikari.domoto@domo.com';
  const phone = input.senderPhone || '050-1782-7024';
  return `${name}
${company}
――――――――――――――――――
JP Tower 11F, 2-7-2 Marunouchi, Chiyoda-ku, Tokyo 100-7014, Japan
Tel: ${phone}
Email: ${email}`;
}

function formatCandidateDates(dates?: string[]): string {
  return dates && dates.length > 0 ? dates.join('、') : '';
}

function buildDirectAppointmentPrompt(input: Extract<EmailGenerateInput, { useCase: 'direct-appointment' }>): string {
  const datesStr = formatCandidateDates(input.candidateDates);
  const contactName = input.contactName || '（不明）';
  const dept = input.department ? `\n部署名：${input.department}` : '';
  return `あなたはドーモ株式会社の道本光として、以下の情報をもとにアポイント依頼メールを作成してください。

${COMMON_RULES}

【導入事例リスト】
以下の事例リストから、訪問先業界・課題に最も近い2〜3社を自動選択して挿入すること。
明らかに合う事例がなければ「※事例は別途ご確認ください」と記載すること。
${CASE_STUDIES}

【入力情報】
訪問先企業名：${input.companyName}${dept}
訪問先業界：${input.industry || '（推測してください）'}
宛先の役職：${input.contactRole || '（不明）'}
宛先の名前：${contactName}
候補日：${datesStr || '（空欄。「ご都合のよい日時をいくつかお知らせいただけますと幸いです。」と記載）'}
何を見たか（WhyYou情報源）：${input.whyYouReason}
取り組み・目指していること：${input.currentInitiative}
データ活用基盤の課題・ボトルネック：${input.dataChallenge}
DOMOで解決できること（断言）：${input.domoSolution}

【件名フォーマット】
${input.companyName} ${input.contactName ? input.contactName + '様' : 'ご担当者様'}｜データ活用基盤に関するご相談【ドーモ株式会社：道本】

【本文構成】
1. 宛名（企業名 + 役職 + 名前様）
2. 「突然のご連絡、大変失礼いたします。ドーモ株式会社の道本光と申します。」（固定）
3. 「[何を見たか（具体的に）]を拝見し、[名前]様に直接ご連絡させていただきました。」
4. WhyYou三段構造（250字前後）: ①取り組み理解 → ②課題指摘 → ③DOMO断言
5. DOMOのプラットフォーム説明（1〜2文）
6. 必ず「URL：https://www.domo.com/jp」という行を1行で記載すること（URLのみ・ラベルなしは不可）
7. 導入事例（2〜3社を箇条書き）
8. アポ依頼 + 候補日
9. 締め + 以下の署名:
${buildSignature(input)}`;
}

function buildSecretaryAppointmentPrompt(input: Extract<EmailGenerateInput, { useCase: 'secretary-appointment' }>): string {
  const datesStr = formatCandidateDates(input.candidateDates);
  const secretaryName = input.secretaryName || '秘書室 ご担当者';
  const dept = input.department ? `\n部署名：${input.department}` : '';
  return `あなたはドーモ株式会社の道本光として、以下の情報をもとに秘書あてアポイント依頼メールを作成してください。

${COMMON_RULES}

【背景】弊社の増谷が事前に秘書へ電話し「道本からメールを送る」と伝えており、このメールはそのリクエストに応えるもの。

【導入事例リスト】
${CASE_STUDIES}

【入力情報】
訪問先企業名：${input.companyName}${dept}
訪問先業界：${input.industry || '（推測してください）'}
秘書の名前：${secretaryName}
アポが欲しい人の役職：${input.targetRole}
アポが欲しい人の名前：${input.targetName}
候補日：${datesStr || `（空欄。「${input.targetName}様のご予定をご確認のうえ、候補日をいくつかお知らせいただけますでしょうか。」と記載）`}
何を見たか：${input.whyYouReason}
取り組み・目指していること：${input.currentInitiative}
データ活用基盤の課題：${input.dataChallenge}
DOMOで解決できること（断言）：${input.domoSolution}

【件名フォーマット】
先日の御礼と${input.targetName}様とのアポイント依頼【ドーモ株式会社：道本】

【本文構成】
1. 宛名（企業名 + 秘書名様）
2. 「お世話になっております。ドーモ株式会社の道本と申します。先日は、${input.targetName}様とのアポイント依頼にて弊社増谷からのお電話にご対応いただきまして誠にありがとうございました。」（固定）
3. WhyYou（250字前後）
4. DOMOのプラットフォーム説明（1〜2文）
5. 必ず「URL：https://www.domo.com/jp」という行を1行で記載すること（URLのみ・ラベルなしは不可）
6. 導入事例（2〜3社）
7. 「本内容に関しまして、${input.targetName}様と1時間の議論の場をいただきたいと考えております。」+ 候補日
8. 締め + 以下の署名:
${buildSignature(input)}`;
}

function buildBusinessCardFollowupPrompt(input: Extract<EmailGenerateInput, { useCase: 'business-card-followup' }>): string {
  const contactName = input.contactName || 'ご担当者';
  const dept = input.department || '（部署不明）';
  return `あなたはドーモ株式会社の道本として、名刺交換後の初回アプローチメールを作成してください。

【生成時の絶対禁止事項】
- 売り込み感を出さない。情報提供・提案スタンスで書く
- 出力はJSON形式のみ: {"subject": "件名", "body": "本文"}

【送付先情報】
企業名：${input.companyName}
部署名：${dept}
担当者名：${contactName}

【冒頭文（固定）】
お世話になっております。
ドーモ株式会社の道本と申します。
以前は弊社井川とのご挨拶の機会をいただき、有難うございました。

【本文構成】
① Domoの紹介: ${dept}に最も刺さりそうな特長から1〜2点を選び「弊社Domoは〜を実現できるプラットフォームです」という語り口で紹介
② 課題共感: ${input.companyName}・${dept}が抱えていそうな課題を「そんな中で貴社としても、〜といった点でお悩みではないでしょうか」と1〜2文
③ 役回りへの言及: 「${contactName}様のお立場では、〜といった観点でご関心をお持ちいただけるのではと思いご連絡しました」
④ クロージング（固定）:「ぜひ一度、1時間ほどお時間をいただき、事例も交えながらご説明できればと考えております。もしよろしければ、ご都合のよい日程をいくつかご共有いただけますでしょうか。どうぞよろしくお願いいたします。」
⑤ 署名:
${buildSignature(input)}`;
}

function buildCustomPrompt(input: CustomEmailInput): string {
  const VARIABLES: Record<string, string> = {
    '{企業名}': input.companyName || '',
    '{部署名}': input.department || '',
    '{役職名}': input.contactRole || '',
    '{担当者名}': input.contactName || '',
    '{差出人名}': input.senderName || 'Hikari Michimoto / 道本 光',
    '{差出人企業名}': input.senderCompany || 'Domo, Inc.',
    '{差出人メールアドレス}': input.senderEmail || 'hikari.domoto@domo.com',
    '{差出人電話番号}': input.senderPhone || '050-1782-7024',
  };

  let prompt = input.customPrompt;
  for (const [key, value] of Object.entries(VARIABLES)) {
    prompt = prompt.replaceAll(key, value);
  }
  for (const [key, value] of Object.entries(input.customFields || {})) {
    prompt = prompt.replaceAll(`{${key}}`, value || '');
  }

  return `${prompt}

【出力形式】JSONのみ（説明文不要）: {"subject": "件名", "body": "本文"}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { input }: { input: EmailGenerateInput | CustomEmailInput } = body;

    if (!input?.companyName) {
      return NextResponse.json({ error: '企業名は必須です' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY が設定されていません' }, { status: 500 });
    }

    const isCustom = (input as CustomEmailInput).useCase === 'custom';

    if (!isCustom && (input as EmailGenerateInput).useCase === 'other-dept-expansion') {
      return NextResponse.json({ error: 'このユースケースは現在準備中です' }, { status: 400 });
    }

    let userPrompt: string;
    let useCaseForOutput: string;

    if (isCustom) {
      userPrompt = buildCustomPrompt(input as CustomEmailInput);
      useCaseForOutput = (input as CustomEmailInput).useCaseId;
    } else {
      const typed = input as EmailGenerateInput;
      useCaseForOutput = typed.useCase;
      if (typed.useCase === 'direct-appointment') {
        userPrompt = buildDirectAppointmentPrompt(typed);
      } else if (typed.useCase === 'secretary-appointment') {
        userPrompt = buildSecretaryAppointmentPrompt(typed);
      } else {
        userPrompt = buildBusinessCardFollowupPrompt(typed as Extract<EmailGenerateInput, { useCase: 'business-card-followup' }>);
      }
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: userPrompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const parsed = JSON.parse(jsonMatch[0]);

    const output: EmailGenerateOutput = {
      subject: parsed.subject || '',
      body: parsed.body || '',
      useCase: useCaseForOutput as any,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ email: output });
  } catch (error) {
    console.error('Email generation error:', error);
    return NextResponse.json({ error: 'メールの生成に失敗しました' }, { status: 500 });
  }
}
