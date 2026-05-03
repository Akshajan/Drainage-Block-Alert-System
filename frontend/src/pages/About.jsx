export default function About() {
  return (
    <div>
      <h2 style={{marginTop: 0}}>About the Project</h2>
      <div className="card">
        <p>
          <strong>Drainage Block Alert</strong> is a project idea developed by the IT students of Barton Hill Engineering College. 
          This project is a part of the <strong>Smart City Initiative</strong>, focusing on early and efficient detection of drainage blocks 
          to prevent damage caused by waterlogging and flooding.
        </p>
        <p>
          The system uses <strong>ultrasonic sensors</strong> to monitor drainage systems in real-time. When a block is detected, 
          an alert message is sent to the respective government authorities, enabling them to take quick action 
          and mitigate potential damage.
        </p>
      </div>

      <h2>Project Abstract</h2>
      <div className="card">
        <p>
          The <strong>Drainage Block Alert System</strong> is designed to address the growing concern of urban flooding caused by 
          blocked drainage systems. By leveraging IoT technology, the system continuously monitors the water levels 
          in drainage channels using ultrasonic sensors. When a blockage is detected, the system sends an instant 
          alert to the concerned authorities via SMS or email, providing the exact location of the blockage.
        </p>
        <p>
          This project aims to reduce the response time of authorities, minimize damage to property and infrastructure, 
          and improve the overall efficiency of urban drainage management. It is a step towards building smarter and 
          more resilient cities.
        </p>
      </div>
    </div>
  );
}
