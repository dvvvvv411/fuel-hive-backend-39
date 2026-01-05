-- Step 1: Add DELETE policy for resend_configs
CREATE POLICY "Allow authenticated users to delete resend configs"
ON public.resend_configs
FOR DELETE
USING (auth.role() = 'authenticated');

-- Step 2: Update shops to set resend_config_id = NULL for configs being deleted
UPDATE public.shops 
SET resend_config_id = NULL 
WHERE resend_config_id IN (
  'c49e6070-55f0-4314-a0ca-cb75087368af',
  '4c7af8c5-569b-4a25-b1b6-526f33b83819',
  '3b222104-8071-4cfb-be89-0b3dad9a7861',
  'c1cafc74-a8bc-4686-86ed-7334ec3b0bbe',
  'ed75ec0a-ca08-4735-82c0-1dbb87a37bfe',
  '301fd464-8657-49c8-bb93-eb8dc2f67eca',
  '3638d6b4-fe62-4036-b9d2-2860f88daea5',
  '4dc94e7e-068c-4bc7-868c-1f5bac198a1d',
  '1e1ca139-0ca3-4db5-8dc6-28a5715e85d7',
  '418cf398-7bed-4d6d-9e12-b3bb06fa4352',
  '5cec3489-5e50-4a62-a2ba-30fb0af30c66',
  '6889c36c-6f15-4468-b0c1-36dd88652fb3',
  '6796b3c8-f744-4288-93f0-5dd0b411ced7',
  'ad780a5c-d9f0-471e-8f70-1598dc3c3d60',
  'a9f57fa4-704f-4754-9a64-ae55a13dc354',
  '9ee5a21f-8183-458e-b5cd-5230d96c80ed',
  '9b04b721-7e3b-4f58-88d8-864ea701806e',
  '6a003f2f-6b00-4094-a1a3-d4162da87115',
  '93e22c9f-1598-4a8f-b5d9-5bd1a542ef75',
  '9cc967b1-a58f-45a6-938a-47f0c8531f20',
  '20d84758-b153-4511-97b1-c774093330fc',
  'a565ca40-6a83-407b-878e-883d27d5104f',
  '6a280881-36cb-4a4b-8e4f-02f9c257de0a',
  '735b755e-95db-48b5-8e25-a6e7cc939007',
  '4eb75db2-b150-4bee-8407-612bc0703a51',
  '331721a5-0faf-4f39-8f24-a3396b56f19d'
);

-- Step 3: Delete the 26 resend configs
DELETE FROM public.resend_configs 
WHERE id IN (
  'c49e6070-55f0-4314-a0ca-cb75087368af',
  '4c7af8c5-569b-4a25-b1b6-526f33b83819',
  '3b222104-8071-4cfb-be89-0b3dad9a7861',
  'c1cafc74-a8bc-4686-86ed-7334ec3b0bbe',
  'ed75ec0a-ca08-4735-82c0-1dbb87a37bfe',
  '301fd464-8657-49c8-bb93-eb8dc2f67eca',
  '3638d6b4-fe62-4036-b9d2-2860f88daea5',
  '4dc94e7e-068c-4bc7-868c-1f5bac198a1d',
  '1e1ca139-0ca3-4db5-8dc6-28a5715e85d7',
  '418cf398-7bed-4d6d-9e12-b3bb06fa4352',
  '5cec3489-5e50-4a62-a2ba-30fb0af30c66',
  '6889c36c-6f15-4468-b0c1-36dd88652fb3',
  '6796b3c8-f744-4288-93f0-5dd0b411ced7',
  'ad780a5c-d9f0-471e-8f70-1598dc3c3d60',
  'a9f57fa4-704f-4754-9a64-ae55a13dc354',
  '9ee5a21f-8183-458e-b5cd-5230d96c80ed',
  '9b04b721-7e3b-4f58-88d8-864ea701806e',
  '6a003f2f-6b00-4094-a1a3-d4162da87115',
  '93e22c9f-1598-4a8f-b5d9-5bd1a542ef75',
  '9cc967b1-a58f-45a6-938a-47f0c8531f20',
  '20d84758-b153-4511-97b1-c774093330fc',
  'a565ca40-6a83-407b-878e-883d27d5104f',
  '6a280881-36cb-4a4b-8e4f-02f9c257de0a',
  '735b755e-95db-48b5-8e25-a6e7cc939007',
  '4eb75db2-b150-4bee-8407-612bc0703a51',
  '331721a5-0faf-4f39-8f24-a3396b56f19d'
);