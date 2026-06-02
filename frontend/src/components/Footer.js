import React from 'react';
import styled from '@emotion/styled';

const FooterContainer = styled.footer`
  background: #FFF7F0;
  border-top: 2px solid #FFE2D4;
  margin-top: 4rem;
  padding: 3rem 2rem 2rem;
  border-radius: 40px 40px 0 0;
`;

const FooterContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const FooterCol = styled.div`
  flex: 1;
  min-width: 200px;
`;

const FooterTitle = styled.h4`
  font-size: 1.2rem;
  font-weight: 700;
  color: #AC7E68;
  margin-bottom: 1rem;
`;

const FooterLink = styled.p`
  color: #7F665A;
  margin: 0.6rem 0;
  display: flex;
  align-items: center;
  gap: 8px;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const SocialIcons = styled.div`
  display: flex;
  gap: 1.2rem;
  margin-top: 1rem;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const SocialLink = styled.a`
  font-size: 1.6rem;
  color: #D28D72;
  transition: 0.2s;

  &:hover {
    color: #EAB29A;
    transform: translateY(-3px);
  }
`;

const FooterBottom = styled.div`
  text-align: center;
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #FFE2D4;
  color: #A98978;
  font-size: 0.85rem;
`;

const Footer = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <FooterCol>
          <FooterTitle>📞 Contact</FooterTitle>
          <FooterLink>📱 +63 (2) 8123 4567</FooterLink>
          <FooterLink>✉️ hello@strayloveph.org</FooterLink>
          <FooterLink>📍 123 Compassion St., Mandaluyong, PH</FooterLink>
        </FooterCol>
        <FooterCol>
          <FooterTitle>🌐 Socials</FooterTitle>
          <SocialIcons>
            <SocialLink href="#"><span>📘</span></SocialLink>
            <SocialLink href="#"><span>📷</span></SocialLink>
            <SocialLink href="#"><span>🐦</span></SocialLink>
            <SocialLink href="#"><span>🎵</span></SocialLink>
          </SocialIcons>
          <FooterLink>🐾 Follow our rescue journey</FooterLink>
        </FooterCol>
        <FooterCol>
          <FooterTitle>🛡️ Policies</FooterTitle>
          <FooterLink>📄 Adoption Agreement</FooterLink>
          <FooterLink>🔒 Privacy & Data</FooterLink>
          <FooterLink>🤝 Responsible Ownership Pledge</FooterLink>
        </FooterCol>
      </FooterContent>
      <FooterBottom>
        © 2025 STRAY Love Ph Foundation — Rescue. Rehabilitate. Rehome.
      </FooterBottom>
    </FooterContainer>
  );
};

export default Footer;