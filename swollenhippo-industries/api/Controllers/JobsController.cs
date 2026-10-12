using System.Globalization;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SwollenHippo.Api.Data;
<<<<<<< Updated upstream
=======
using SwollenHippo.Api.Dtos;
>>>>>>> Stashed changes
using SwollenHippo.Api.Models;

namespace SwollenHippo.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
<<<<<<< Updated upstream
public sealed class JobsController(SwollenHippoDbContext objDbContext) : ControllerBase
{
    [HttpGet("my-jobs")]
    [Authorize(Roles = "Customer")]
=======
public sealed class JobsController(AppDbContext objDbContext) : ControllerBase
{
    [HttpGet("my-jobs")]
    [Authorize(Roles = nameof(UserRole.Customer))]
>>>>>>> Stashed changes
    public async Task<ActionResult<IReadOnlyList<Job>>> GetMyJobs(CancellationToken objCancellationToken)
    {
        string? strUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(strUserId, NumberStyles.None, CultureInfo.InvariantCulture, out int intUserId))
        {
            return Unauthorized();
        }

        List<Job> lstJobs = await objDbContext.Jobs
            .AsNoTracking()
            .Where(objJob => objJob.AssignedUserId == intUserId)
            .ToListAsync(objCancellationToken);

        return Ok(lstJobs);
    }

    [HttpPatch("{id:int}/status")]
<<<<<<< Updated upstream
    [Authorize(Roles = "Admin")]
=======
    [Authorize(Roles = nameof(UserRole.Admin))]
>>>>>>> Stashed changes
    public async Task<ActionResult<Job>> UpdateJobStatus(
        int id,
        [FromBody] UpdateJobStatusDto objUpdateJobStatusDto,
        CancellationToken objCancellationToken)
    {
        if (!Enum.IsDefined(objUpdateJobStatusDto.Status))
        {
            return BadRequest("Status must be Pending, InProgress, Complete, or Shipped.");
        }

        Job? objJob = await objDbContext.Jobs
            .FirstOrDefaultAsync(objExistingJob => objExistingJob.Id == id, objCancellationToken);
        if (objJob is null)
        {
            return NotFound();
        }

        objJob.Status = objUpdateJobStatusDto.Status;
        await objDbContext.SaveChangesAsync(objCancellationToken);

        return Ok(objJob);
    }
}
