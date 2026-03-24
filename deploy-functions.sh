#!/bin/bash
set -e

supabase functions deploy extract-item --no-verify-jwt
supabase functions deploy generate-outfit --no-verify-jwt
supabase functions deploy generate-styling-note --no-verify-jwt
