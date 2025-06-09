use anchor_lang::prelude::*;

declare_id!("HHJGbnqHDvbssE6eXqaJ8VKV9T58WLs96QGVCH89UyU");

#[program]
pub mod count {
    use super::*;

    pub fn initialize(ctx: Context<InitializeCounter>) -> Result<()> {
        let counter = &mut ctx.accounts.global_counter;
        counter.count = 0;
        Ok(())
    }

    pub fn increment(ctx: Context<IncrementCounter>) -> Result<()> {
        let counter = &mut ctx.accounts.global_counter;
        counter.count += 1;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeCounter<'info> {
    #[account(init, payer = user, space = 8 + 8, seeds = [b"counter"], bump)]
    pub global_counter: Account<'info, GlobalCounter>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>

}

#[derive(Accounts)]
pub struct IncrementCounter<'info> {
    #[account(mut, seeds = [b"counter"], bump)]
    pub global_counter: Account<'info, GlobalCounter>
}

#[account]
pub struct GlobalCounter {
    pub count: u64,
}