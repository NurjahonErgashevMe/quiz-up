const { gsap } = require('gsap');

class Alert {
    constructor() {
        this.alert = document.createElement('div');
        this.alert.className = 'custom-alert';
        this.alert.style.cssText = `
            position: fixed;
            top: -100px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #fff;
            padding: 15px 25px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            opacity: 0;
        `;
        document.body.appendChild(this.alert);
    }

    show(message, type = 'success') {
        // Set message
        this.alert.textContent = message;

        // Set color based on type
        if (type === 'success') {
            this.alert.style.backgroundColor = '#4CAF50';
            this.alert.style.color = '#fff';
        } else if (type === 'error') {
            this.alert.style.backgroundColor = '#f44336';
            this.alert.style.color = '#fff';
        }

        // Animation timeline
        const tl = gsap.timeline();
        
        tl.to(this.alert, {
            top: '20px',
            opacity: 1,
            duration: 0.5,
            ease: 'power2.out'
        })
        .to(this.alert, {
            opacity: 0,
            top: '-100px',
            duration: 0.5,
            delay: 3,
            ease: 'power2.out'
        });
    }
}

module.exports = {
    alert: new Alert()
};