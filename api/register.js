// ไฟล์ api/register.js (โค้ดหลังบ้าน Node.js บน Vercel)

export default async function handler(req, res) {
    // บังคับให้รองรับการยิงมาจากหน้าบ้าน (CORS)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { uid, name, date, start, end } = req.body;
        const timestamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });

        // 🎯 1. ใส่ข้อมูลของพี่ตรงนี้:
        const SHEETDB_API_URL = 'https://sheetdb.io/api/v1/630xkz61217fs';
        const LINE_TOKEN = 'ak4rGcQnj8q+VTaXJQY+ISjEr76h5PPJfiaTa8KzXpgRjpxZB+QKivbLI2tgHD22wGH9yP86Uiis7y5azIZAejwsMVBmwUrfjpp+JzgRx9wQDuD2XX/mj1ERi/H7sbqna2aQorAX+h2jlpHnmInCGQdB04t89/1O/w1cDnyilFU=';

        // 🌟 บันทึกข้อมูลลง Google Sheet ผ่าน SheetDB
        const sheetPayload = {
            data: [{
                "Timestamp": timestamp,
                "Line_UID": uid,
                "Name": name,
                "Date": date,
                "Start_Time": start,
                "End_Time": end
            }]
        };

        await fetch(SHEETDB_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sheetPayload)
        });

        // 🌟 ให้ Line OA ส่งข้อความและ QR Code สวนกลับไปหายูสเซอร์ (รันบนหลังบ้าน ไม่ติด CORS แน่นอน)
        const qrRawData = `${name}|${date}|${start}|${end}`;
        const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrRawData)}`;
        
        const linePayload = {
            "to": uid,
            "messages": [
                {
                    "type": "text",
                    "text": `✨ ลงทะเบียนเข้าพบสำเร็จ!\n👤 ผู้ติดต่อ: ${name}\n📅 วันที่: ${date}\n⏰ เวลา: ${start} - ${end} น.\n\nโปรดใช้ QR Code ด้านล่างนี้ในการสแกนเข้า-ออกพื้นที่ครับ`
                },
                {
                    "type": "image",
                    "originalContentUrl": qrImageUrl,
                    "previewImageUrl": qrImageUrl
                }
            ]
        };

        const lineRes = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${LINE_TOKEN}`
            },
            body: JSON.stringify(linePayload)
        });

        const lineData = await lineRes.json();

        return res.status(200).json({ success: true, lineResponse: lineData });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, error: error.message });
    }
}
