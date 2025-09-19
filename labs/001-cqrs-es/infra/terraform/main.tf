terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}
provider "aws" {
  region = var.region
}
# Example: S3 bucket stub for artifacts or event snapshots
resource "aws_s3_bucket" "artifacts" {
  bucket = "${var.project_prefix}-artifacts"
}
output "bucket_name" { value = aws_s3_bucket.artifacts.bucket }
