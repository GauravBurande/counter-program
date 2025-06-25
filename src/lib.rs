use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::{ProgramResult},
    entrypoint,
    msg,
    pubkey::Pubkey,
    program_error::ProgramError
};

#[derive(BorshDeserialize, BorshSerialize)]
struct Counter {
    count: u32
}

#[derive(BorshDeserialize, BorshSerialize)]
enum CounterInstruction {
    Increment(u32),
    Decrement(u32)
}

entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8]
) -> ProgramResult {
    let account = next_account_info(&mut accounts.iter())?;
    if account.owner != program_id {
        msg!("Provided Data account is incorrect!");
        return Err(ProgramError::InvalidAccountData);
    }
    let mut counter = Counter::try_from_slice(&account.data.borrow())?;

    match CounterInstruction::try_from_slice(instruction_data)? {
        CounterInstruction::Increment(amount) => {
            msg!("Incrementing counter by 1");
            counter.count = counter.count.saturating_add(amount);
            msg!("Incremented by {}, new count: {}", amount, counter.count);
        }
        CounterInstruction::Decrement(amount) => {
            msg!("Decrementing counter by 1");
            if counter.count < amount {
                msg!("Cannot decrement below zero");
                return  Err(ProgramError::InvalidInstructionData);
            }
            counter.count -= amount;
        }
    }

    counter.serialize(&mut *account.data.borrow_mut())?;

    Ok(())
}