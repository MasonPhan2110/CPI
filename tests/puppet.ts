import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { assert } from "chai";
import { Puppet } from "../target/types/puppet";
import { PuppetMaster } from "../target/types/puppet_master";
const { SystemProgram } = anchor.web3;

describe("puppet", () => {

  let provider = anchor.AnchorProvider.local();
  // Configure the client to use the local cluster.
  anchor.setProvider(provider);

  it("Perform CPI from puppet master to support", async () => {

    const puppetMaster = anchor.workspace.PuppetMaster as Program<PuppetMaster>;
    const puppet = anchor.workspace.Puppet as Program<Puppet>;
    
    // Initialize a new puppet account
    const newPuppetAccount = anchor.web3.Keypair.generate();
    const tx = await puppet.methods
    .initialize()
    .accounts({
      puppet: newPuppetAccount.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([newPuppetAccount])
    .rpc();

    // Invoke the puppet master to perform a CPI to the puppet
    await puppetMaster.methods.pullStrings(new anchor.BN(111))
    .accounts({
      puppet: newPuppetAccount.publicKey,
      puppetProgram: puppet.programId,
    })
    .rpc();
    // Check the state updated.
    let puppetAccount = await puppet.account.data.fetch(newPuppetAccount.publicKey);
    assert.ok(puppetAccount.data.eq(new anchor.BN(111)));
  });
});
