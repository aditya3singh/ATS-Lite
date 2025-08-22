$ErrorActionPreference = 'Stop'

Set-Location -LiteralPath "$PSScriptRoot\.."

$py = ".\.venv\Scripts\python.exe"
if (-not (Test-Path $py)) {
	python -m venv .venv
	& $py -m pip install --upgrade pip
	& $py -m pip install -r requirements.txt
	& $py -m spacy download en_core_web_sm
}

$base = 'http://127.0.0.1:8780'
$p = Start-Process -FilePath $py -ArgumentList '-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8780','--log-level','warning' -PassThru
Start-Sleep -Seconds 3

try {
	# Health
	$null = Invoke-WebRequest -Uri ($base + '/health') -TimeoutSec 10

	# Signup
	$email = 'test_' + ([guid]::NewGuid().ToString()) + '@example.com'
	$signupBody = @{ email = $email; password = 'secret12'; full_name = 'Test User' } | ConvertTo-Json -Depth 5
	$signup = Invoke-RestMethod -Method Post -Uri ($base + '/auth/signup') -ContentType 'application/json' -Body $signupBody

	# Login
	$loginBody = @{ email = $email; password = 'secret12' } | ConvertTo-Json -Depth 5
	$login = Invoke-RestMethod -Method Post -Uri ($base + '/auth/login') -ContentType 'application/json' -Body $loginBody
	$token = $login.access_token
	$headers = @{ Authorization = 'Bearer ' + $token }

	# Create job
	$jobPayload = @{ title='Data Scientist'; description='Python ML NLP SQL'; skills=@('python','ml','nlp','sql') } | ConvertTo-Json -Depth 5
	$job = Invoke-RestMethod -Method Post -Uri ($base + '/jobs/') -ContentType 'application/json' -Headers $headers -Body $jobPayload
	$jid = $job.id

	# Upload resume via curl.exe for multipart
	Set-Content -LiteralPath 'tmp_resume.txt' -Value 'Experienced in Python, ML, NLP, SQL and FastAPI.' -Encoding UTF8
	$upload = & curl.exe -s -H ('Authorization: Bearer ' + $token) -F "file=@tmp_resume.txt" ($base + '/resumes/')

	# List resumes and pick newest
	$rs = Invoke-RestMethod -Headers $headers -Uri ($base + '/resumes/')
	$resumeId = $rs[0].id

	# Poll for parsed flag
	$parsed = $false
	for ($i=0; $i -lt 50; $i++) {
		$rs = Invoke-RestMethod -Headers $headers -Uri ($base + '/resumes/')
		$r = $rs | Where-Object { $_.id -eq $resumeId }
		if ($r.parsed) { $parsed = $true; break } else { Start-Sleep -Milliseconds 200 }
	}

	# Match
	$match = Invoke-RestMethod -Headers $headers -Uri ($base + '/matching/resume/' + $resumeId + '/job/' + $jid)
	$score = $match.score

	Write-Output ("OK tokenLen={0} jid={1} rid={2} parsed={3} score={4}" -f $token.Length, $jid, $resumeId, $parsed, $score)
}
finally {
	Stop-Process -Id $p.Id -Force
}



