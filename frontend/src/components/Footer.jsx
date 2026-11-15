function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <h2>StreamX</h2>

        <p>Watch movies, series and entertainment anytime, anywhere.</p>
        <div className="footer-social-icon">
          <a href="www.facebook.com" className="facebook"><i class="fa-brands fa-facebook-f"></i></a>
          <a href="www.youtube.com" className="youtube"><i class="fa-brands fa-youtube"></i></a>
          <a href="www.instagram.com" className="instagram"><i class="fa-brands fa-instagram"></i></a>
          <a href="www.linkedin.com" className="linkedin"><i class="fa-brands fa-linkedin-in"></i></a>
          <a href="www.twitter.com" className="twitter"><i class="fa-brands fa-x-twitter"></i></a>
        </div>

        <div className="footer-links">
          <a href="/about"><span>About Us</span></a>
          <a href="/contact"><span>Contact Us</span></a>
          <a href="/privacy"><span>Privacy</span></a>
          <a href="/terms"><span>Terms</span></a>
          <a href="/help"><span>Help</span></a>
          <a href="/faq"><span>FAQ</span></a>
        </div>

        <div className="contact-links">
          <span><i class="fa-solid fa-location-dot location"></i> Kolkata, West Bengal</span>
          <span><i class="fa-solid fa-envelope mail"></i> support@streamx.com</span>
          <span><i class="fa-solid fa-phone phone"></i> +91 1234567890</span>
        </div>

        <p className="copyright">© {new Date().getFullYear()} StreamX. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
