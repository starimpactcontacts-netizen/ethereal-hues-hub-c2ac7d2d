/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your Loopgate password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>LOOPGATE</Text>
        <Heading style={h1}>Reset your password</Heading>
        <Text style={text}>
          Someone requested a password reset for your Loopgate account. Click below to set your new password and get straight back in.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Log back in →
        </Button>
        <Text style={footer}>
          If you didn't request a password reset, you can safely ignore this
          email. Your password will not be changed.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#000000', fontFamily: 'Arial, sans-serif' }
const container = { padding: '40px 25px', maxWidth: '460px', margin: '0 auto' }
const brand = {
  color: '#D4A857',
  fontSize: '13px',
  fontWeight: 'bold' as const,
  letterSpacing: '4px',
  margin: '0 0 18px',
}
const h1 = {
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#ffffff',
  margin: '0 0 18px',
}
const text = {
  fontSize: '15px',
  color: '#c9c9c9',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const button = {
  backgroundColor: '#D4A857',
  color: '#000000',
  fontSize: '15px',
  fontWeight: 'bold' as const,
  borderRadius: '10px',
  padding: '14px 22px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#777777', margin: '30px 0 0' }
