const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

async function debug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to DB");

    const collections = await mongoose.connection.db
      .listCollections()
      .toArray();
    console.log("\nCollections:", collections.map((c) => c.name).join(", "));

    const TeamMember = mongoose.connection.db.collection("teammembers");
    const members = await TeamMember.find({}).toArray();
    console.log("\nTeam Members Count:", members.length);
    members.forEach((m, i) => {
      console.log(
        `${i + 1}. UserID: ${m.user}, Org: ${m.organization}, Role: ${
          m.role
        }, Active: ${m.isActive}`
      );
    });

    const TeamInvitation = mongoose.connection.db.collection("teaminvitations");
    const invitations = await TeamInvitation.find({}).toArray();
    console.log("\nInvitations Count:", invitations.length);
    invitations.forEach((inv, i) => {
      console.log(
        `${i + 1}. Email: ${inv.email}, Status: ${inv.status}, Token: ${
          inv.token
        }, AcceptedBy: ${inv.acceptedBy}, AcceptedAt: ${inv.acceptedAt}`
      );
    });

    const Organization = mongoose.connection.db.collection("organizations");
    const orgs = await Organization.find({}).toArray();
    console.log("\nOrganizations Count:", orgs.length);
    orgs.forEach((org, i) => {
      console.log(
        `${i + 1}. Name: ${org.name}, MemberCount: ${org.memberCount}, ID: ${
          org._id
        }`
      );
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

debug();
