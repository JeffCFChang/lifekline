import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 只允许 POST 请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 验证访问密码
    const { password, messages, seed } = req.body;
    const accessPassword = process.env.ACCESS_PASSWORD;

    if (!accessPassword || password !== accessPassword) {
        return res.status(401).json({ error: '訪問密碼錯誤' });
    }

    // 获取 API 配置
    const apiKey = process.env.OPENAI_API_KEY;
    const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    const model = process.env.OPENAI_MODEL || 'gpt-5-mini';

    if (!apiKey) {
        return res.status(500).json({ error: '服務器未配置 API Key' });
    }

    try {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages,
                max_completion_tokens: 65000,
                seed: seed || undefined  // 添加 seed 参数
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            return res.status(response.status).json({
                error: `API 請求失敗: ${response.status}`,
                details: errText
            });
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error: any) {
        console.error('API Error:', error);
        return res.status(500).json({
            error: '服務器錯誤',
            details: error.message
        });
    }
}
