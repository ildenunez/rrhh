async function test() {
  // 1. Create a request for Aaron (empId 16)
  const req1 = await fetch('http://localhost:3000/api/requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      employee_id: 16,
      type: 'absence',
      amount: '-5.00',
      observation: 'Test Vac',
      absence_type_id: 1, // Vacation type
      start_date: '2026-07-01',
      end_date: '2026-07-05',
      creator_id: 11,
      isDirectApprove: true
    })
  });
  const data1 = await req1.json();
  console.log('Created request:', data1.request?.id);
  
  // 2. Delete it
  const req2 = await fetch('http://localhost:3000/api/requests?id=' + data1.request.id + '&refund=true', {
    method: 'DELETE'
  });
  const data2 = await req2.json();
  console.log('Deleted request result:', data2);
}
test();
