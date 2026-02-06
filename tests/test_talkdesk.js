const testTalkdesk = async () => {
    const url = 'http://localhost:3000/api/talkdesk';

    const tests = [
        { message: 'Hola' },
        { message: 'Quiero parar mi reparto' },
        { message: 'Necesito pedir agua urgente' }
    ];

    for (const t of tests) {
        console.log(`\nTesting: "${t.message}"`);
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(t)
            });
            const data = await res.json();
            console.log('Response:', JSON.stringify(data, null, 2));
        } catch (e) {
            console.error('Error:', e.message);
        }
    }
};

testTalkdesk();
