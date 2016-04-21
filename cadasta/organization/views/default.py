from django.http import Http404
from django.db import transaction
import django.views.generic as generic
from django.shortcuts import redirect, get_object_or_404
from django.core.urlresolvers import reverse
from django.utils.text import slugify
from django.utils.translation import gettext as _
import formtools.wizard.views as wizard
from tutelary.models import Role

from core.mixins import PermissionRequiredMixin, LoginPermissionRequiredMixin
from accounts.models import User

from ..models import Organization, Project, OrganizationRole, ProjectRole
from .mixins import OrganizationMixin, ProjectQuerySetMixin
from .. import forms
from .. import messages as error_messages


class OrganizationList(PermissionRequiredMixin, generic.ListView):
    model = Organization
    template_name = 'organization/organization_list.html'
    permission_required = 'org.list'
    permission_filter_queryset = ('org.view',)


class OrganizationAdd(LoginPermissionRequiredMixin, generic.CreateView):
    model = Organization
    form_class = forms.OrganizationForm
    template_name = 'organization/organization_add.html'
    permission_required = 'org.create'

    def get_perms_objects(self):
        return []

    def get_success_url(self):
        return reverse(
            'organization:dashboard',
            kwargs={'slug': self.object.slug}
        )

    def get_form_kwargs(self, *args, **kwargs):
        kwargs = super().get_form_kwargs(*args, **kwargs)
        kwargs['user'] = self.request.user
        return kwargs


class OrganizationDashboard(PermissionRequiredMixin, generic.DetailView):
    model = Organization
    template_name = 'organization/organization_dashboard.html'
    permission_required = 'org.view'


class OrganizationEdit(LoginPermissionRequiredMixin,
                       generic.UpdateView):
    model = Organization
    form_class = forms.OrganizationForm
    template_name = 'organization/organization_edit.html'
    permission_required = 'org.update'
    permission_denied_message = error_messages.ORG_EDIT

    def get_success_url(self):
        return reverse(
            'organization:dashboard',
            kwargs={'slug': self.object.slug}
        )


class OrganizationArchive(LoginPermissionRequiredMixin,
                          generic.DetailView):
    model = Organization
    permission_required = 'org.archive'
    permission_denied_message = error_messages.ORG_ARCHIVE

    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        self.object.archived = True
        self.object.save()

        return redirect(self.get_success_url())

    def get_success_url(self):
        return reverse(
            'organization:dashboard',
            kwargs={'slug': self.object.slug}
        )


class OrganizationUnarchive(LoginPermissionRequiredMixin,
                            generic.DetailView):
    model = Organization
    permission_required = 'org.unarchive'
    permission_denied_message = error_messages.ORG_UNARCHIVE

    def get(self, request, *args, **kwargs):
        self.object = self.get_object()
        self.object.archived = False
        self.object.save()

        return redirect(self.get_success_url())

    def get_success_url(self):
        return reverse(
            'organization:dashboard',
            kwargs={'slug': self.object.slug}
        )


class OrganizationMembers(LoginPermissionRequiredMixin, generic.DetailView):
    model = Organization
    template_name = 'organization/organization_members.html'
    permission_required = 'org.users.list'
    permission_denied_message = error_messages.ORG_USERS_LIST


class OrganizationMembersAdd(OrganizationMixin,
                             LoginPermissionRequiredMixin,
                             generic.CreateView):
    model = OrganizationRole
    form_class = forms.AddOrganizationMemberForm
    template_name = 'organization/organization_members_add.html'
    permission_required = 'org.users.add'
    permission_denied_message = error_messages.ORG_USERS_ADD

    def get_context_data(self, *args, **kwargs):
        context = super().get_context_data(*args, **kwargs)
        context['object'] = self.get_organization()
        return context

    def get_form_kwargs(self, *args, **kwargs):
        kwargs = super().get_form_kwargs(*args, **kwargs)

        if self.request.method == 'POST':
            kwargs['organization'] = self.get_organization()

        return kwargs

    def get_success_url(self):
        return reverse(
            'organization:members_edit',
            kwargs={'slug': self.object.organization.slug,
                    'username': self.object.user.username}
        )


class OrganizationMembersEdit(OrganizationMixin,
                              LoginPermissionRequiredMixin,
                              generic.edit.FormMixin,
                              generic.DetailView):
    slug_field = 'username'
    slug_url_kwarg = 'username'
    template_name = 'organization/organization_members_edit.html'
    form_class = forms.EditOrganizationMemberForm
    permission_required = 'org.users.edit'
    permission_denied_message = error_messages.ORG_USERS_EDIT

    def get_success_url(self):
        return reverse(
            'organization:members',
            kwargs={'slug': self.get_organization().slug}
        )

    def get_queryset(self):
        return self.get_organization().users.all()

    def get_form(self):
        if self.request.method == 'POST':
            return self.form_class(self.request.POST,
                                   self.get_organization(),
                                   self.get_object())
        else:
            return self.form_class(None,
                                   self.get_organization(),
                                   self.get_object())

    def get_context_data(self, *args, **kwargs):
        context = super().get_context_data(*args, **kwargs)
        context['organization'] = self.get_organization()
        context['form'] = self.get_form()
        return context

    def post(self, request, *args, **kwargs):
        self.object = self.get_object()
        form = self.get_form()
        if form.is_valid():
            return self.form_valid(form)
        else:
            return self.form_invalid(form)

    def form_valid(self, form):
        form.save()
        return super().form_valid(form)


class OrganizationMembersRemove(OrganizationMixin,
                                LoginPermissionRequiredMixin,
                                generic.DeleteView):
    permission_required = 'org.users.remove'
    permission_denied_message = error_messages.ORG_USERS_REMOVE

    def get_object(self):
        return OrganizationRole.objects.get(
            organization__slug=self.kwargs['slug'],
            user__username=self.kwargs['username'],
        )

    def get_success_url(self):
        return reverse(
            'organization:members',
            kwargs={'slug': self.get_organization().slug}
        )

    def get(self, *args, **kwargs):
        return self.post(*args, **kwargs)


class UserList(LoginPermissionRequiredMixin, generic.ListView):
    model = User
    template_name = 'organization/user_list.html'
    permission_required = 'user.list'
    permission_denied_message = error_messages.USERS_LIST

    def get_context_data(self, **kwargs):
        context = super(UserList, self).get_context_data(**kwargs)
        for user in self.object_list:
            if user.organizations.count() == 0:
                user.org_names = '&mdash;'
            else:
                user.org_names = ', '.join(
                    sorted(map(lambda o: o.name, user.organizations.all()))
                )
        return context


class UserActivation(LoginPermissionRequiredMixin, generic.View):
    permission_required = 'user.update'
    permission_denied_message = error_messages.USERS_UPDATE
    new_state = None

    def get_perms_objects(self):
        return [get_object_or_404(User, username=self.kwargs['user'])]

    def post(self, request, user):
        userobj = get_object_or_404(User, username=user)
        userobj.is_active = self.new_state
        userobj.save()
        return redirect('user:list')


class ProjectList(PermissionRequiredMixin, ProjectQuerySetMixin,
                  generic.ListView):
    model = Project
    template_name = 'organization/project_list.html'
    permission_required = 'project.list'
    permission_filter_queryset = ('project.view',)

    def get_context_data(self, **kwargs):
        context = super(ProjectList, self).get_context_data(**kwargs)
        context['add_allowed'] = Organization.objects.count() > 0
        return context


def assign_project_extent_context(context, project):
    ext = project.extent.extent
    context['extent'] = True
    context['wlon'] = ext[0]
    context['slat'] = ext[1]
    context['elon'] = ext[2]
    context['nlat'] = ext[3]
    context['boundary'] = list(map(lambda t: [t[1], t[0]],
                                   project.extent.coords[0]))


class ProjectDashboard(PermissionRequiredMixin, generic.DetailView):
    def get_actions(view, request):
        if view.get_object().public():
            return 'project.view'
        else:
            return 'project.view_private'

    model = Project
    template_name = 'organization/project_dashboard.html'
    permission_required = {'GET': get_actions}
    permission_denied_message = error_messages.PROJ_VIEW

    def get_context_data(self, **kwargs):
        context = super(ProjectDashboard, self).get_context_data(**kwargs)
        # TODO: Used for deciding whether to show statistics or
        # "getting started".  Needs to be set up properly later on.
        context['has_content'] = False
        if self.object.extent is None:
            context['extent'] = False
        else:
            assign_project_extent_context(context, self.object)
        return context

    def get_object(self, queryset=None):
        queryset = Project.objects.filter(
            organization__slug=self.kwargs.get('organization'),
            project_slug=self.kwargs.get('project')
        )
        try:
            obj = queryset.get()
        except queryset.model.DoesNotExist:
            raise Http404(_("No projects found matching the query"))
        return obj


PROJECT_ADD_FORMS = [('extents', forms.ProjectAddExtents),
                     ('details', forms.ProjectAddDetails),
                     ('permissions', forms.ProjectAddPermissions)]

PROJECT_ADD_TEMPLATES = {
    'extents': 'organization/project_add_extents.html',
    'details': 'organization/project_add_details.html',
    'permissions': 'organization/project_add_permissions.html'
}


def add_wizard_permission_required(self, view, request):
    if request.method != 'POST':
        return ()
    session = request.session.get('wizard_project_add_wizard', None)
    if session is None or 'details' not in session['step_data']:
        return ()
    else:
        return 'project.create'


class ProjectAddWizard(LoginPermissionRequiredMixin, wizard.SessionWizardView):
    permission_required = add_wizard_permission_required
    form_list = PROJECT_ADD_FORMS

    def __init__(self, *args, **kwargs):
        self.organization = None
        self.members = None
        super().__init__(*args, **kwargs)

    def get_perms_objects(self):
        session = self.request.session.get('wizard_project_add_wizard', None)
        if session is None or 'details' not in session['step_data']:
            return []
        else:
            slug = session['step_data']['details']['details-organization'][0]
            return [Organization.objects.get(slug=slug)]

    def get_template_names(self):
        return [PROJECT_ADD_TEMPLATES[self.steps.current]]

    def get_context_data(self, *args, **kwargs):
        context = super().get_context_data(*args, **kwargs)
        orgs = Organization.objects.order_by('name')
        context['org_logos'] = {o.slug: o.logo for o in orgs}
        logo = orgs.first().logo if orgs.first() is not None else ''
        context['init_org_logo'] = logo
        context['init_org_hidden'] = 'org-logo-hidden' if logo is None else ''
        form = context['wizard']['form']
        if isinstance(form, forms.ProjectAddExtents):
            context['wizard_step_classes'] = {
                'extent': 'active enabled',
                'details': '',
                'permissions': ''
            }
        elif isinstance(form, forms.ProjectAddDetails):
            context['wizard_step_classes'] = {
                'extent': 'enabled complete',
                'details': 'active enabled',
                'permissions': ''
            }
        elif isinstance(form, forms.ProjectAddPermissions):
            context['members'] = context['wizard']['form'].members
            context['wizard_step_classes'] = {
                'extent': 'enabled complete',
                'details': 'enabled complete',
                'permissions': 'active enabled'
            }
        return context

    def process_step(self, form):
        result = self.get_form_step_data(form)
        if 'details-organization' in result:
            self.organization = result['details-organization']
        return result

    def get_form_kwargs(self, step=None):
        if step == 'permissions':
            return {'organization': self.organization}
        else:
            return {}

    def done(self, form_list, form_dict, **kwargs):
        form_data = [form.data for form in form_list]
        location = form_data[0]['extents-location']
        name = form_data[1]['details-name']
        description = form_data[1]['details-description']
        organization = form_data[1]['details-organization']
        url = form_data[1]['details-url']
        # private = form_data[1]['details-public'] != 'on'
        org = Organization.objects.get(slug=organization)
        try:
            su_role = Role.objects.get(name='superuser')
        except:
            su_role = None
        usernames = []
        for user in org.users.all():
            is_admin = any([isinstance(pol, Role) and pol == su_role
                            for pol in user.assigned_policies()])
            if not is_admin:
                if OrganizationRole.objects.get(organization=org,
                                                user=user).admin:
                    is_admin = True
            if not is_admin:
                usernames.append(user.username)
        user_roles = [(k, form_data[2][k]) for k in usernames]

        with transaction.atomic():
            project = Project.objects.create(
                name=name, organization=org, project_slug=slugify(name),
                description=description, urls=[url], extent=location
            )
            for username, role in user_roles:
                user = User.objects.get(username=username)
                ProjectRole.objects.create(
                    project=project, user=user, role=role
                )

        return redirect('organization:project-dashboard',
                        organization=organization,
                        project=project.project_slug)


class ProjectEdit(generic.TemplateView):
    template_name = 'organization/project_edit.html'
    permission_denied_message = error_messages.PROJ_EDIT