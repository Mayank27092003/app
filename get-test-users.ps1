# PowerShell Script to Get Test User Information
# Run this in PowerShell to get User IDs, JWT Tokens, and Conversation ID

$backendUrl = "http://localhost:3001"

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Getting Test User Information for WebRTC Audio Test  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Function to login and get token
function Get-UserInfo {
    param($email, $password, $userName)
    
    Write-Host "Attempting to login as: $email" -ForegroundColor Yellow
    
    try {
        $body = @{
            email = $email
            password = $password
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$backendUrl/api/v1/auth/login" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -ErrorAction Stop
        
        Write-Host "✅ Login successful!" -ForegroundColor Green
        Write-Host "   User ID: $($response.data.user.id)" -ForegroundColor White
        Write-Host "   Token: $($response.data.token.substring(0,50))..." -ForegroundColor White
        
        return @{
            userId = $response.data.user.id
            token = $response.data.token
            email = $email
            name = "$($response.data.user.firstName) $($response.data.user.lastName)"
        }
    }
    catch {
        Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Function to create a new user
function New-TestUser {
    param($email, $password, $firstName, $lastName, $userName)
    
    Write-Host "Creating new user: $email" -ForegroundColor Yellow
    
    try {
        $body = @{
            email = $email
            password = $password
            firstName = $firstName
            lastName = $lastName
            userName = $userName
            phoneNumber = "+1234567890"
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$backendUrl/api/v1/auth/signup" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body `
            -ErrorAction Stop
        
        Write-Host "✅ User created successfully!" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "⚠️  User creation failed (user may already exist): $($_.Exception.Message)" -ForegroundColor Yellow
        return $false
    }
}

# Function to get or create conversation
function Get-Conversation {
    param($token, $user1Id, $user2Id)
    
    Write-Host "`nGetting conversation between users..." -ForegroundColor Yellow
    
    try {
        # Try to get existing conversations
        $conversations = Invoke-RestMethod -Uri "$backendUrl/api/v1/conversations" `
            -Method GET `
            -Headers @{"Authorization"="Bearer $token"} `
            -ErrorAction Stop
        
        if ($conversations.data -and $conversations.data.length -gt 0) {
            $convId = $conversations.data[0].id
            Write-Host "✅ Found existing conversation: $convId" -ForegroundColor Green
            return $convId
        }
    }
    catch {
        Write-Host "⚠️  Could not get conversations: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    # Create new conversation
    try {
        Write-Host "Creating new conversation..." -ForegroundColor Yellow
        $body = @{
            participantUserId = $user2Id
        } | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "$backendUrl/api/v1/conversations/direct" `
            -Method POST `
            -Headers @{"Authorization"="Bearer $token"} `
            -ContentType "application/json" `
            -Body $body `
            -ErrorAction Stop
        
        $convId = $response.data.id
        Write-Host "✅ Created new conversation: $convId" -ForegroundColor Green
        return $convId
    }
    catch {
        Write-Host "❌ Could not create conversation: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Main Script
Write-Host "📋 Step 1: Getting/Creating Test Users`n" -ForegroundColor Cyan

# Test user credentials
$user1Email = "testuser1@loadrider.com"
$user1Pass = "Test@12345"
$user2Email = "testuser2@loadrider.com"
$user2Pass = "Test@12345"

# Try to login User 1
$user1 = Get-UserInfo -email $user1Email -password $user1Pass

if (-not $user1) {
    Write-Host "`nUser 1 doesn't exist. Creating..." -ForegroundColor Yellow
    New-TestUser -email $user1Email -password $user1Pass -firstName "Test" -lastName "User1" -userName "testuser1"
    Start-Sleep -Seconds 2
    $user1 = Get-UserInfo -email $user1Email -password $user1Pass
}

Write-Host ""

# Try to login User 2
$user2 = Get-UserInfo -email $user2Email -password $user2Pass

if (-not $user2) {
    Write-Host "`nUser 2 doesn't exist. Creating..." -ForegroundColor Yellow
    New-TestUser -email $user2Email -password $user2Pass -firstName "Test" -lastName "User2" -userName "testuser2"
    Start-Sleep -Seconds 2
    $user2 = Get-UserInfo -email $user2Email -password $user2Pass
}

if (-not $user1 -or -not $user2) {
    Write-Host "`n❌ Failed to get both users. Please check your backend and try again.`n" -ForegroundColor Red
    exit
}

Write-Host "`n📋 Step 2: Getting/Creating Conversation`n" -ForegroundColor Cyan

$conversationId = Get-Conversation -token $user1.token -user1Id $user1.userId -user2Id $user2.userId

if (-not $conversationId) {
    Write-Host "`n❌ Failed to get conversation. Please check your backend and try again.`n" -ForegroundColor Red
    exit
}

# Display all information
Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║           ✅ ALL INFORMATION READY! ✅                  ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "🎯 WINDOW 1 (User A) - Copy these values:`n" -ForegroundColor Cyan
Write-Host "   Email: $($user1.email)" -ForegroundColor White
Write-Host "   User ID: $($user1.userId)" -ForegroundColor Yellow
Write-Host "   JWT Token:" -ForegroundColor White
Write-Host "   $($user1.token)" -ForegroundColor Yellow
Write-Host "   Conversation ID: $conversationId" -ForegroundColor Yellow
Write-Host "   Other User ID: $($user2.userId)" -ForegroundColor Yellow

Write-Host "`n🎯 WINDOW 2 (User B) - Copy these values:`n" -ForegroundColor Cyan
Write-Host "   Email: $($user2.email)" -ForegroundColor White
Write-Host "   User ID: $($user2.userId)" -ForegroundColor Yellow
Write-Host "   JWT Token:" -ForegroundColor White
Write-Host "   $($user2.token)" -ForegroundColor Yellow
Write-Host "   Conversation ID: $conversationId" -ForegroundColor Yellow
Write-Host "   Other User ID: $($user1.userId)" -ForegroundColor Yellow

Write-Host "`n📋 SUMMARY TABLE:`n" -ForegroundColor Cyan

$table = @(
    [PSCustomObject]@{
        Field = "Backend URL"
        "Window 1 (User A)" = "http://localhost:3001"
        "Window 2 (User B)" = "http://localhost:3001"
    }
    [PSCustomObject]@{
        Field = "Email"
        "Window 1 (User A)" = $user1.email
        "Window 2 (User B)" = $user2.email
    }
    [PSCustomObject]@{
        Field = "User ID"
        "Window 1 (User A)" = $user1.userId
        "Window 2 (User B)" = $user2.userId
    }
    [PSCustomObject]@{
        Field = "Token"
        "Window 1 (User A)" = $user1.token.substring(0,30) + "..."
        "Window 2 (User B)" = $user2.token.substring(0,30) + "..."
    }
    [PSCustomObject]@{
        Field = "Conversation ID"
        "Window 1 (User A)" = $conversationId
        "Window 2 (User B)" = $conversationId
    }
    [PSCustomObject]@{
        Field = "Other User ID"
        "Window 1 (User A)" = $user2.userId
        "Window 2 (User B)" = $user1.userId
    }
)

$table | Format-Table -AutoSize

Write-Host "`n🚀 NEXT STEPS:`n" -ForegroundColor Cyan
Write-Host "1. Open http://localhost:3001/public/test-audio.html in TWO browser windows" -ForegroundColor Yellow
Write-Host "2. Copy the values from above into each window" -ForegroundColor Yellow
Write-Host "3. Click 'Connect to Backend' in both windows" -ForegroundColor Yellow
Write-Host "4. Window 1: Click 'Start Call'" -ForegroundColor Yellow
Write-Host "5. Window 2: Click 'Accept Call'" -ForegroundColor Yellow
Write-Host "6. SPEAK AND LISTEN - Audio should work! 🎵" -ForegroundColor Green
Write-Host ""

# Save to file for reference
$outputFile = "test-users-info.txt"
$output = "WebRTC Audio Test - User Information`n"
$output += "=====================================`n"
$output += "Generated: $(Get-Date)`n`n"
$output += "WINDOW 1 (User A):`n"
$output += "Backend URL: http://localhost:3001`n"
$output += "Email: $($user1.email)`n"
$output += "Password: $user1Pass`n"
$output += "User ID: $($user1.userId)`n"
$output += "JWT Token: $($user1.token)`n"
$output += "Conversation ID: $conversationId`n"
$output += "Other User ID: $($user2.userId)`n`n"
$output += "WINDOW 2 (User B):`n"
$output += "Backend URL: http://localhost:3001`n"
$output += "Email: $($user2.email)`n"
$output += "Password: $user2Pass`n"
$output += "User ID: $($user2.userId)`n"
$output += "JWT Token: $($user2.token)`n"
$output += "Conversation ID: $conversationId`n"
$output += "Other User ID: $($user1.userId)`n`n"
$output += "Test Page URL:`n"
$output += "http://localhost:3001/public/test-audio.html`n"

$output | Out-File -FilePath $outputFile -Encoding UTF8
Write-Host "Information saved to file: $outputFile" -ForegroundColor Green
Write-Host "`n"
