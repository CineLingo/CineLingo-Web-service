// 다중 사용자 큐 테스트 시뮬레이션
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// 테스트용 사용자 ID들
const testUsers = [
  'test-user-1',
  'test-user-2', 
  'test-user-3',
  'test-user-4',
  'test-user-5'
]

// 큐에 요청 추가 함수
async function addToQueue(userId, requestId) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/rapid-worker`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        reference_id: 'test-ref-id',
        reference_audio_url: 'https://example.com/test.wav',
        input_text: `Test request from ${userId}`,
        user_id: userId
      })
    })
    
    const data = await response.json()
    console.log(`✅ ${userId} added to queue:`, data.queue_info)
    return data
  } catch (error) {
    console.error(`❌ Error adding ${userId} to queue:`, error)
  }
}

// 큐 상태 확인 함수
async function checkQueueStatus(requestId) {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/rapid-worker?request_id=${requestId}`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    })
    
    const data = await response.json()
    return data.queue_info
  } catch (error) {
    console.error(`❌ Error checking queue status:`, error)
  }
}

// 시뮬레이션 실행
async function runMultiUserTest() {
  console.log('🚀 Starting multi-user queue test...')
  
  const requests = []
  
  // 1. 여러 사용자가 동시에 요청
  console.log('\n📝 Adding multiple users to queue...')
  for (let i = 0; i < testUsers.length; i++) {
    const userId = testUsers[i]
    const requestId = `test-request-${i + 1}`
    
    const result = await addToQueue(userId, requestId)
    if (result) {
      requests.push({ userId, requestId, queueInfo: result.queue_info })
    }
    
    // 1초 간격으로 요청
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  // 2. 각 요청의 큐 상태 확인
  console.log('\n🔍 Checking queue status for all requests...')
  for (const request of requests) {
    const status = await checkQueueStatus(request.requestId)
    console.log(`${request.userId}: position ${status.position}/${status.total_in_queue}, status: ${status.status}`)
  }
  
  // 3. 순번 변화 시뮬레이션 (첫 번째 사용자 완료)
  console.log('\n🎯 Simulating first user completion...')
  await supabase
    .from('queue_status')
    .update({ status: 'completed' })
    .eq('request_id', requests[0].requestId)
  
  // 4. 업데이트된 상태 확인
  console.log('\n📊 Checking updated queue status...')
  for (const request of requests.slice(1)) {
    const status = await checkQueueStatus(request.requestId)
    console.log(`${request.userId}: position ${status.position}/${status.total_in_queue}, status: ${status.status}`)
  }
  
  console.log('\n✅ Multi-user test completed!')
}

// 테스트 실행
if (require.main === module) {
  runMultiUserTest().catch(console.error)
}

module.exports = { runMultiUserTest, addToQueue, checkQueueStatus } 