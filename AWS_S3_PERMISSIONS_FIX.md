# AWS S3 Permissions Fix Guide

## 🚨 Current Issue
Your IAM user `engineer-level-1-access` has an **explicit deny** for `s3:ListBucket` on the `forecastai-file-upload` bucket, which is blocking your application from listing files.

## 🔍 Error Analysis
```
AccessDenied: User: arn:aws:iam::771826808649:user/engineer-level-1-access 
is not authorized to perform: s3:ListBucket on resource: "arn:aws:s3:::forecastai-file-upload" 
with an explicit deny in an identity-based policy
```

## 🛠️ Solution Steps

### Step 1: Check for Explicit Deny Policies

1. **Go to AWS IAM Console**
   - Navigate to: https://console.aws.amazon.com/iam/
   - Select your account: `771826808649`

2. **Find the User**
   - Go to "Users" → "engineer-level-1-access"

3. **Check Attached Policies**
   - Look for any policies with `"Effect": "Deny"`
   - Pay special attention to policies that deny `s3:ListBucket`

### Step 2: Remove Explicit Deny Policies

**Option A: Remove the Deny Policy Entirely**
```json
// Find and remove this type of policy:
{
  "Effect": "Deny",
  "Action": "s3:ListBucket",
  "Resource": "*"
}
```

**Option B: Modify the Deny Policy to Exclude Your Bucket**
```json
{
  "Effect": "Deny",
  "Action": "s3:ListBucket",
  "Resource": [
    "arn:aws:s3:::other-bucket-1",
    "arn:aws:s3:::other-bucket-2"
    // Remove or exclude: "arn:aws:s3:::forecastai-file-upload"
  ]
}
```

### Step 3: Add Required Permissions

**Create a new policy or modify existing one:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObjectVersion",
        "s3:PutObjectAcl"
      ],
      "Resource": [
        "arn:aws:s3:::forecastai-file-upload",
        "arn:aws:s3:::forecastai-file-upload/*"
      ]
    }
  ]
}
```

### Step 4: Check Service Control Policies (SCPs)

If you're using AWS Organizations, check for SCPs that might be denying access:

1. **Go to AWS Organizations Console**
2. **Check SCPs** for any deny policies
3. **Remove or modify** SCPs that deny S3 access

### Step 5: Verify Bucket Policy

Check if the S3 bucket itself has a policy that denies access:

1. **Go to S3 Console**
2. **Select bucket**: `forecastai-file-upload`
3. **Go to "Permissions" tab**
4. **Check "Bucket policy"**
5. **Remove any deny statements** for your IAM user

### Step 6: Test Permissions

After making changes, test with AWS CLI:

```bash
# Test listing bucket contents
aws s3 ls s3://forecastai-file-upload/

# Test uploading a file
aws s3 cp test.txt s3://forecastai-file-upload/

# Test downloading a file
aws s3 cp s3://forecastai-file-upload/test.txt ./
```

## 🚨 Important Notes

1. **Explicit Deny Overrides Allow**: An explicit deny will always override any allow permissions
2. **Check All Policy Types**:
   - Inline policies
   - Attached managed policies
   - Service Control Policies (SCPs)
   - Bucket policies
   - Organization policies

3. **Principle of Least Privilege**: Only grant the minimum permissions needed

## 🔧 Alternative Solutions

### Option 1: Create New IAM User
If fixing the existing user is too complex, create a new IAM user with proper permissions.

### Option 2: Use IAM Role Instead
For production, consider using an IAM role instead of user credentials.

### Option 3: Temporary Fix
As a temporary workaround, you could modify your application to handle the 403 error gracefully and show a user-friendly message.

## 📞 Need Help?

If you need assistance with AWS IAM policies, consider:
1. AWS Support (if you have a support plan)
2. AWS Documentation: https://docs.aws.amazon.com/IAM/latest/UserGuide/
3. AWS Policy Simulator: https://policysim.aws.amazon.com/ 