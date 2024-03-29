using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Identity.Web;
using Microsoft.Identity.Web.UI;
using SonyIMX500.Hubs;
using SonyIMX500.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SonyIMX500
{
    public class Startup
    {
        private bool _useAAD = false;
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {
            var config = Configuration.GetSection("Azure").Get<AppSettings>();

            if (config.UseAAD)
            {
                // enable AAD Authentication
                _useAAD = true;
                services.AddMicrosoftIdentityWebAppAuthentication(Configuration, "AzureAd");
            }

            services.AddMvc();
            services.AddControllersWithViews()
                .AddMicrosoftIdentityUI();

            services.Configure<AppSettings>(Configuration.GetSection("Azure"));
            services.AddSignalR(options => options.EnableDetailedErrors = true)
                .AddAzureSignalR(Configuration.GetSection("Azure")
                                    .GetSection("SignalR")
                                    .GetValue<string>("ConnectionString"));
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
            }

            app.UseStaticFiles();
            app.UseRouting();
            app.UseCookiePolicy();
            app.UseAuthentication();
            app.UseAuthorization();

            app.UseAzureSignalR(routes =>
            {
                routes.MapHub<TelemetryHub>("/telemetryhub");
            });

            app.UseEndpoints(endpoints =>
            {
                if (_useAAD != true)
                {
                    endpoints.MapControllers().WithMetadata(new AllowAnonymousAttribute());
                }

                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "{controller=Home}/{action=Index}/{id?}");
            });
        }
    }
}
